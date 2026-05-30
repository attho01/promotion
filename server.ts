import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

function getAIClient(req: express.Request) {
  const customKey = req.headers["x-gemini-api-key"] as string;
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key가 누락되었습니다. 랜딩페이지에서 API 키를 입력해 주세요.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function formatAIError(error: any): string {
  const errorStr = String(error.message || error.status || error || "");
  const lowerStr = errorStr.toLowerCase();
  
  if (
    errorStr.includes("API_KEY_INVALID") ||
    lowerStr.includes("api key not valid") ||
    lowerStr.includes("invalid key") ||
    lowerStr.includes("key is invalid") ||
    lowerStr.includes("key not valid") ||
    lowerStr.includes("api key not found") ||
    lowerStr.includes("invalid_argument")
  ) {
    return "입력하신 Gemini API 키가 유효하지 않거나 비활성화되어 있습니다. 구글 AI Studio에서 취득한 정확한 Key를 공백 없이 입력해 주세요.";
  }
  
  return error.message || "알 수 없는 에러가 발생했습니다.";
}

// Global default fallback instance for backward compatibility or non-request flows if any
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Key Validation Route
app.post("/api/validate-key", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ success: false, error: "API 키를 입력해 주세요." });
    }
    const testAi = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    // Test check with a very lightweight content generation request to verify key validation
    const response = await testAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "ping",
      config: {
        maxOutputTokens: 2
      }
    });

    if (response) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false, error: "유효하지 않은 API 키이거나 정식 응답을 받지 못했습니다." });
    }
  } catch (error: any) {
    console.error("Error validating API key:", error);
    const errorMsg = formatAIError(error);
    return res.json({ success: false, error: errorMsg });
  }
});

// 1. PDF / 텍스트 분석 핵심 3가지 추출 API
app.post("/api/analyze-doc", async (req, res) => {
  try {
    const { fileData, fileName, mimeType, descriptionText } = req.body;

    let contents: any[] = [];
    let systemInstruction = "당신은 여성새로일하기센터 참여자 모집에 도움이 되는 핵심 참여 혜택 및 유인 포인트를 분석하는 요약 전문가입니다. 입력된 자료(텍스트 또는 문서 파일)를 검토하여, 여성 구직자들이 가장 눈여겨볼 만한 핵심 가치/혜택 포인트 딱 3가지를 친절하고 직관적인 설명글 형태로 추출해 주세요.";

    if (fileData && mimeType) {
      const base64Data = fileData.split(",")[1] || fileData;
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      contents.push({
        text: `첨부된 문서파일(${fileName})을 철저히 분석하고, 아래의 직접 입력 설명글도 함께 참고하여 이 교육훈련/사업 계획서에서 구직 여성들의 참여 유인 핵심 포인트 3가지를 추출해 주세요.\n\n참고 설명글: ${descriptionText || "없음"}`
      });
    } else {
      contents.push({
        text: `다음 입력된 교육 프로그램 설명 및 혜택 자료를 분석하여, 구직 여성들의 마음을 끌 수 있는 핵심 참여 혜택/유인 포인트 딱 3가지를 추출해 주세요.\n\n설명 자료:\n${descriptionText || "정보 없음"}`
      });
    }

    const client = getAIClient(req);
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "참여 유인 핵심 포인트 3가지 (각각 1-2문장의 구체적 혜택 중심 문구 성격)"
            }
          },
          required: ["points"]
        }
      }
    });

    const textResult = response.text || "{}";
    const parsed = JSON.parse(textResult.trim());
    res.json({ success: true, points: parsed.points || [] });
  } catch (error: any) {
    console.error("Error in /api/analyze-doc:", error);
    const errorMsg = formatAIError(error);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 2. 스크립트 세트 자동 생성 API
app.post("/api/generate-scripts", async (req, res) => {
  try {
    const input = req.body;
    
    const targetText = input.targets.join(", ");
    const toneText = input.tones.join(", ");
    const channelText = input.channels.join(", ");
    const pointsText = input.extractedPoints.map((p: string, i: number) => `${i+1}. ${p}`).join("\n");
    
    const { period, classSchedule, quota, applyMethod } = input.schedule;

    const promptText = `
프로그램 대상 및 일정 정보를 활용하여, 채널별 맞춤형 모집 홍보 스크립트를 작성해 주세요.

## 📋 입력 정보 요약
- 프로그램명: ${input.programType}
- 참여 유인 핵심 혜택 3선:
${pointsText}
- 주요 모집 대상: ${targetText}
- 원하는 스크립트 톤앤매너: ${toneText}
- 홍보 채널 목록: ${channelText}

## 🗓️ 모집 및 교육 일정
- 모집 기간: ${period || "미정"}
- 교육 일정: ${classSchedule || "미정"}
- 모집 정원: ${quota || "미정"}
- 신청 방법 및 문의처: ${applyMethod || "미정"}

각 지정된 채널별로 **최소 5개씩** 완전히 다른 관점과 톤을 반영한 스크립트를 생성해 주세요.
반드시 각 스크립트마다 'Reasoning(전략 근거 1~2문장)' → 'Conclusion(최종 스크립트)' 구조를 정확하게 유지해야 합니다.
그 중에서도 Conclusion(최종 스크립트) 문구는 줄바꿈(\\n)을 활용해 **최소 3줄**로 작성해 주세요. 두 줄만 쓰면 안 되고 반드시 삼단 구조(줄바꿈으로 구분된 3줄)여야 합니다.
- 첫째 줄: 해당 모집 대상 여성의 실질적 고민이나 상황에 깊게 공감하는 관심 유도 멘트
- 둘째 줄: 이 프로그램을 통해 얻을 수 있는 확실한 참여 가치 및 혜택 요약 제시
- 셋째 줄: 구체적인 연락처 및 신청방법, 마감 임박 요소(선착순 정원 및 모집 기간 등)를 포함하여 액션을 자극하는 구체적 행동 유도

또한 각 채널 고유의 제약 사항을 빈틈없이 반영해야 합니다:
1. **문자/카카오톡**: 90자 이내의 대단히 간결하고 핵심적인 압축 요약형으로 작성 (신청처 필수).
2. **전화 안내**: 친근하고 따뜻한 구어체 한글 대화톤(오프닝 + 혜택 + 신청 유도).
3. **Facebook**: 구직 희망 여성의 상황과 마음에 깊이 호소하는 편안하고 입체적인 스토리텔링.
4. **Instagram**: 핵심만 각인시키는 임팩트 강한 단문, 트렌디함 및 적절한 이모지 다수 포함, 프로필 링크 유도 필수.
5. **Blog**: 상세하고 친근한 설명형 및 FAQ 대상자 Q&A 방식 가미. Blog 채널 스크립트 생성 시에는 반드시 블로그 글에 유용할 연관 핵심 해시태그 5~7개를 추가해 주어야 함.
6. **전단지**: 직관적인 시선 강탈 대형 헤드라인과 굵직한 핵심 혜택 목록형 구조 중심.
7. **현수막·배너**: 5~10자 이내의 극강의 초단문 임팩트 헤더 문구와 연결 가능한 슬로건 1개 & 연락처 1개.

출력 데이터는 아래 JSON 스키마를 정밀하게 만족하도록 맞춰 주세요.
`;

    const systemInstruction = `당신은 여성새로일하기센터(새일센터)의 성장을 이끄는 최고의 홍보 스크립트 작성 전문가이자 전략가입니다.
참여자 수강 신청 및 방문 신청 효율을 최고치로 끌어올리기 위해, 정해진 톤앤매너 규칙과 채널별 제약을 엄격히 준수합니다.
제시하는 모든 스크립트의 Conclusion(최종 결과물)은 무조건 줄바꿈 2회 이상이 포함된 세 줄 구조여야 하며, 줄별 기획 의도가 선명해야 합니다.`;

    const client = getAIClient(req);
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channelName: { type: Type.STRING, description: "채널명 (예: 문자/카카오톡, 전화 안내 등)" },
              scripts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER, description: "스크립트 고유 ID (1~5번)" },
                    tone: { type: Type.STRING, description: "반영한 구체적인 톤앤매너 명칭" },
                    reasoning: { type: Type.STRING, description: "해당 스크립트가 해당 채널에 왜 효과적인지 밝히는 명료한 전략적 해석 1~2문장" },
                    conclusion: { type: Type.STRING, description: "줄바꿈(\\n 코드 포함)을 명시적으로 포함하여 정확하게 3줄 구조로 완성된 최종 스크립트 본문" }
                  },
                  required: ["id", "tone", "reasoning", "conclusion"]
                }
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Blog 등 검색 노출이 핵심인 채널의 경우 동적 생성할 해시태그 5~7개 (예: '#새일센터', '#여성취업' 등)"
              }
            },
            required: ["channelName", "scripts"]
          }
        }
      }
    });

    const parsedResult = JSON.parse((response.text || "[]").trim());
    res.json({ success: true, channels: parsedResult });
  } catch (error: any) {
    console.error("Error in /api/generate-scripts:", error);
    const errorMsg = formatAIError(error);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 3. 피드백 기반 스크립트 수정 및 채널 확장 API
app.post("/api/feedback-scripts", async (req, res) => {
  try {
    const { originalChannels, inputs, feedback } = req.body;

    const feedbackSummary = `
## 📢 사용자의 피드백 요약
1. 마음에 드는 원본 스크립트 ID/번호: ${feedback.selectedScriptId || "선택하지 않음"}
2. 추가 보완하고 싶은 신규 톤앤매너: ${feedback.additionalTone || "없음"}
3. 더 강력하게 조명해야 하는 참여 혜택: ${feedback.highlightBenefit || "없음"}
4. 신청 방법 및 상세 문의처 반영 여부: ${feedback.includeContact || "유지"}
5. 신규 확장 또는 고도화할 보강 채널: ${feedback.extendChannel || "없음"}
`;

    const promptText = `
이전 단계에서 수집한 원본 스크립트 데이터를 사용자가 직접 검토한 후 피드백 및 고도화 요청을 제출했습니다.
아래 피드백 요청사항을 100% 흡수하여 만족도가 극대화된 **마스터 수정본 스크립트 세트**를 제작해 주세요.

${feedbackSummary}

## 📋 기존 교육 프로그램 원본 개요 및 자료
- 프로그램명: ${inputs.programType}
- 일정, 혜택, 정원: ${JSON.stringify(inputs.schedule)}
- 추출 혜택: ${inputs.extractedPoints.join(", ")}
- 모집 기본 채널: ${inputs.channels.join(", ")}

## ✍️ 피드백 반영 가이드라인:
- 사용자가 선택한 스크립트 스타일의 흐름을 적극 반영하여 각 채널별로 다시 5가지 매력적인 대안을 세심하게 다듬어 제출합니다.
- '신청 방법과 전화번호, 마감'을 스크립트 수료 문장에 듬뿍 강조해서 구직자가 당장 전화를 걸거나 QR/링크로 지원하고 싶도록 문구를 극대화해주세요.
- 이번에도 모든 스크립트는 **줄바꿈(\\n)이 정확히 들어간 3줄 구조의 Conclusion**과 구체적인 **Reasoning** 구성을 완벽히 만족해야 합니다.
- 새로 요청된 확장 채널(있는 경우)을 반드시 포함시켜 채널 리스트를 풍성하게 확장 및 완성해 주세요.

아래 JSON 규격에 맞추어 출력해 주십시오.
`;

    const systemInstruction = `당신은 여성새로일하기센터 참여자 모집 실전 문구 수정을 총괄하는 전담 수석 컨설턴트입니다.
사용자의 피드백을 신속하게 녹여내어 즉각적인 가입 신청율을 배가시킬 수 있도록, 스크립트의 감성 농도와 정보 투명성을 보정합니다.`;

    const client = getAIClient(req);
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channelName: { type: Type.STRING, description: "채널명 (예: 문자/카카오톡, 전화 안내 등)" },
              scripts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER, description: "수정 고유 ID (1~5번)" },
                    tone: { type: Type.STRING, description: "피드백을 조율하여 정교화한 톤앤매너" },
                    reasoning: { type: Type.STRING, description: "원 피드백 요구 조건에 맞춰 개량이 적용된 구체적 사유 및 전략 근거 1~2문장" },
                    conclusion: { type: Type.STRING, description: "줄바꿈(\\n 코드 포함)을 수반하여 완벽히 제작된 고감도 최종 스크립트 본문" }
                  },
                  required: ["id", "tone", "reasoning", "conclusion"]
                }
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Blog 등의 경우 동적 생성할 해시태그 5~7개"
              }
            },
            required: ["channelName", "scripts"]
          }
        }
      }
    });

    const parsedResult = JSON.parse((response.text || "[]").trim());
    res.json({ success: true, channels: parsedResult });
  } catch (error: any) {
    console.error("Error in /api/feedback-scripts:", error);
    const errorMsg = formatAIError(error);
    res.status(500).json({ success: false, error: errorMsg });
  }
});


async function startServer() {
  // Serve static assets or use Vite client-side dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
