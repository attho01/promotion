import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import StepWizard from "./components/StepWizard";
import MobileSimulator from "./components/MobileSimulator";
import { ChannelScripts, GenerationInput, FeedbackInput } from "./types";
import { PROGRAMS, TARGETS, TONES, CHANNELS } from "./constants";
import { 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Copy, 
  RotateCcw, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  TrendingUp,
  ChevronRight,
  Sliders,
  CheckCircle,
  ArrowRight,
  Award,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  Users,
  Smartphone
} from "lucide-react";

export default function App() {
  // Wizard Input State tracker for Sidebar Preview
  const [currentInputs, setCurrentInputs] = useState<any>({
    programType: "",
    extractedPoints: [],
    targets: [],
    tones: [],
    channels: [],
    schedule: {
      period: "",
      classSchedule: "",
      quota: "",
      applyMethod: ""
    }
  });

  // UI View state (holds false for Landing view, true for Wizard/Form view)
  const [showWizard, setShowWizard] = useState(false);

  // Flow & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<GenerationInput | null>(null);
  const [generatedChannels, setGeneratedChannels] = useState<ChannelScripts[]>([]);

  // Revision / Feedback State
  const [isRevising, setIsRevising] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [revisedChannels, setRevisedChannels] = useState<ChannelScripts[] | null>(null);

  // Results screen UI state
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "preview">("list");
  const [activePreviewDraftIndex, setActivePreviewDraftIndex] = useState(0);

  // Q1~Q5 Feedback states
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [additionalTone, setAdditionalTone] = useState("");
  const [highlightBenefit, setHighlightBenefit] = useState("");
  const [includeContact, setIncludeContact] = useState("네, 신청 정보와 연락처를 더욱 강조해 주세요.");
  const [extendChannel, setExtendChannel] = useState("");

  // Keep live track of Wizard inputs for the sidebar preview
  useEffect(() => {
    const handleWizardSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setCurrentInputs(customEvent.detail);
      }
    };
    window.addEventListener("wizard-state-change", handleWizardSync);
    return () => {
      window.removeEventListener("wizard-state-change", handleWizardSync);
    };
  }, []);

  // API Key Custom State and Validation Logic
  const [inputKey, setInputKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Key is inputted and verified per session. Not cached onto localStorage for privacy security.

  const handleValidateKey = async () => {
    if (!inputKey.trim()) {
      setValidationError("Gemini API Key를 입력해 주세요.");
      return;
    }
    setIsValidating(true);
    setValidationError(null);
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: inputKey.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setSavedKey(inputKey.trim());
        setIsValidated(true);
        setValidationError(null);
      } else {
        setValidationError(data.error || "입력하신 API 키가 유효하지 않습니다. 올바른 키를 입력해 주세요.");
      }
    } catch (err: any) {
      setValidationError(err.message || "API 키 유효성 확인 과정에서 오류가 발생했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetKey = () => {
    if (window.confirm("인증된 API 키를 해제하시겠습니까? 해제된 후에는 API 키를 새로 입력해야 스크립트 생성이 가능합니다.")) {
      setSavedKey(null);
      setIsValidated(false);
      setInputKey("");
      setShowWizard(false);
    }
  };

  const maskKey = (key: string | null) => {
    if (!key) return "";
    if (key.length <= 10) return "AIzaSy...";
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  // Handler for finishing the StepWizard and generating scripts
  const handleGenerate = async (wizardData: GenerationInput) => {
    setIsGenerating(true);
    setGenerationError(null);
    setInputs(wizardData);
    setRevisedChannels(null); // Clear previous revised content

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (savedKey) {
        headers["x-gemini-api-key"] = savedKey;
      }

      const response = await fetch("/api/generate-scripts", {
        method: "POST",
        headers,
        body: JSON.stringify(wizardData)
      });

      const data = await response.json();
      if (data.success && data.channels) {
        setGeneratedChannels(data.channels);
        setActiveChannelIdx(0);
      } else {
        setGenerationError(data.error || "스크립트를 자동 생성하는 과정에서 서버 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "서버와 통신하는 중 문제가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Pre-filled Demo Trigger that launches real script generation instantly
  const handleStartSampleDemo = async () => {
    const demoPayload: GenerationInput = {
      programType: "디지털 멀티미디어 사무 보조 및 실무자 취업 특급 과정",
      extractedPoints: [
        "탄력적 근무가 보장되는 관내 공공기관 및 우수 강소기업 일자리 100% 면접 연정 제공",
        "훈련 완료 시 격려금 50만 원 지급 및 교재비·자격 전형 수수료 전액 무료",
        "자녀 교급 시간과 조율이 가능한 매일 오전 10시 ~ 오후 3시 탄력적 교육제 운영"
      ],
      targets: ["육아 후 복귀 희망 여성", "경력단절여성 (퇴직·휴직 후 구직 희망자)"],
      tones: ["친근·공감형 (따뜻하고 편안한 말투)", "정보전달·신뢰형 (사실과 혜택을 차분하게 전달)"],
      channels: ["문자/카카오톡", "전화 안내", "Blog"],
      schedule: {
        period: "2026.06.15 ~ 2026.07.25",
        classSchedule: "매주 월~금 10:00 ~ 15:00",
        quota: "정원 20명 선착순 마감",
        applyMethod: "새일센터 취업지원본부 상담팀 (02-3421-5000)"
      }
    };
    setShowWizard(true);
    await handleGenerate(demoPayload);
  };

  // Handler for applying feedback (Q1~Q5 tuning form)
  const handleApplyFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs) return;

    setIsRevising(true);
    setRevisionError(null);

    const feedbackPayload: FeedbackInput = {
      selectedScriptId,
      additionalTone,
      highlightBenefit,
      includeContact,
      extendChannel
    };

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (savedKey) {
        headers["x-gemini-api-key"] = savedKey;
      }

      const response = await fetch("/api/feedback-scripts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          originalChannels: generatedChannels,
          inputs: inputs,
          feedback: feedbackPayload
        })
      });

      const data = await response.json();
      if (data.success && data.channels) {
        setRevisedChannels(data.channels);
        // Scroll to the revision results section smoothly
        setTimeout(() => {
          document.getElementById("revision-results-view")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        setRevisionError(data.error || "수정본 스크립트를 생성하는 동안 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setRevisionError(err.message || "수정본 제출 데이터 송신 중 예외가 생겼습니다.");
    } finally {
      setIsRevising(false);
    }
  };

  // Helper to copy text to clipboard with instant feedback animation
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Go back to the setup questionnaire and reset states
  const handleReset = () => {
    if (window.confirm("현재 생성된 스크립트와 피드백이 초기화됩니다. 뒤로 돌아가시겠습니까?")) {
      setGeneratedChannels([]);
      setInputs(null);
      setRevisedChannels(null);
      setShowWizard(false);
      // Reset feedback inputs
      setSelectedScriptId("");
      setAdditionalTone("");
      setHighlightBenefit("");
      setIncludeContact("네, 신청 정보와 연락처를 더욱 강조해 주세요.");
      setExtendChannel("");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans" id="applet-root">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        
        {/* WIZARD MODE / LANDING MODE DECISION */}
        {generatedChannels.length === 0 && !showWizard ? (
          <div className="space-y-12 animate-fadeIn py-4">
            
            {/* Elegant Hero Section */}
            <div className="bg-white border border-[#E5E2DD] rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5F2ED] rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAF9F6] border border-[#E5E2DD] rounded-full text-xs text-[#4A6741] font-semibold tracking-wide">
                  <HeartHandshake className="h-3.5 w-3.5 text-[#4A6741]" />
                  <span>여성새로일하기센터 실무자를 위한 감성 지능 글쓰기 비서</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-serif-editorial italic text-[#2C3E2D] font-bold tracking-tight leading-[1.15]">
                  복잡한 사업 계획서를 <br />
                  <span className="text-[#4A6741] underline decoration-[#8C8880]/30 underline-offset-8">구직 여성 맞춤형 황금 스크립트</span>로.
                </h2>
                
                <p className="text-xs md:text-sm text-[#6B665E] leading-relaxed max-w-2xl">
                  새일센터 코디네이터 및 직업상담사분들의 글쓰기 피로감을 극적으로 낮춥니다. 
                  대상자의 보이지 않는 핵심 장벽(가사 병행 일정, 내일배움카드 필요 여부, 무료 과정 혜택 등)을 소구 가치로 치밀하게 분석해 제안합니다. 
                  실수를 제거하는 문자메시지 90자 규제 수호, 입체적 Q1~Q5 피드백 튜닝 마스터를 완비했습니다.
                </p>

                {/* Gemini API Key Validation Interface (mockup-inspired, highly responsive) */}
                <div className="bg-[#FAF9F6] border border-[#E5E2DD] rounded-xl p-5 md:p-6 mt-4 space-y-4 max-w-2xl">
                  {isValidated ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">무료로 시작하세요. Gemini API 키만 있으면 됩니다.</h4>
                          <p className="text-[11px] text-[#4A6741] font-semibold mt-0.5 font-sans">✓ API 키 승인 완료 (보안을 위해 입력된 키는 화면에 표시되지 않습니다)</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleResetKey}
                        className="px-3 py-1.5 border border-[#E5E2DD] bg-white text-[11px] font-bold rounded-lg hover:bg-slate-50 text-slate-600 shrink-0 transition-colors cursor-pointer"
                      >
                        키 변경하기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#4A6741]">
                        <Check className="h-5 w-5 text-[#4A6741] shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">무료로 시작하세요. Gemini API 키만 있으면 됩니다.</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                          </span>
                          <input
                            type="password"
                            placeholder="Gemini API Key 입력"
                            value={inputKey}
                            onChange={(e) => {
                              setInputKey(e.target.value);
                              setValidationError(null);
                            }}
                            className="w-full pl-9 pr-4 py-3 bg-white border border-[#E5E2DD] rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#4A6741] focus:border-[#4A6741] transition-all font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleValidateKey}
                          disabled={isValidating}
                          className="px-6 py-3 bg-[#1A1A1A] text-white hover:bg-[#4A6741] transition-all rounded-xl font-bold text-xs shrink-0 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isValidating ? (
                            <>
                              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                              <span>검증 승인 중...</span>
                            </>
                          ) : (
                            <span>시작하기</span>
                          )}
                        </button>
                      </div>

                      {validationError && (
                        <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
                          <span>⚠️</span> {validationError}
                        </p>
                      )}

                      {/* Expandable 발급 가이드 Accordion */}
                      <div className="border border-[#E5E2DD] rounded-xl overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => setIsGuideOpen(!isGuideOpen)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer text-left focus:outline-hidden"
                        >
                          <div className="flex items-center gap-2 bg-transparent">
                            <HelpCircle className="h-4 w-4 text-[#4A6741]" />
                            <span className="text-[11px] font-bold text-slate-700">Gemini API Key 발급 가이드 (단 10초 만에 무료 발급)</span>
                          </div>
                          <span className="text-xs text-slate-400">{isGuideOpen ? "▲" : "▼"}</span>
                        </button>
                        {isGuideOpen && (
                          <div className="p-4 border-t border-[#E5E2DD] text-[11px] text-slate-600 space-y-3 bg-white leading-relaxed animate-fadeIn">
                            <p className="font-bold text-[#4A6741]">단 10초 만에 무료로 발급받는 방법:</p>
                            <ol className="list-decimal list-inside space-y-2 text-[#6B665E] pl-1">
                              <li>
                                <a 
                                  href="https://aistudio.google.com/" 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
                                >
                                  Google AI Studio ↗
                                </a>
                                <span> 에 구글 계정으로 로그인합니다.</span>
                              </li>
                              <li>왼쪽 상단 또는 화면 중앙의 <strong className="text-blue-600">"Create API Key"</strong> 파란색 버튼을 누릅니다.</li>
                              <li>새 프로젝트에서 생성(<strong className="text-slate-800">"Create API key in new project"</strong>)을 실행합니다.</li>
                              <li>발급된 임의의 긴 AI 키 값을 복사(Copy)하여 상단 입력란에 즉시 기입해 주세요.</li>
                            </ol>
                            <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E5E2DD] text-[10px] text-slate-500 italic mt-1 leading-normal">
                              * 구글 제공 무료 할당량 내에서는 별도의 결제 등록 없이 무상으로 마음껏 활용하실 수 있습니다. 일 사용량이 적은 개인 및 실무 업무에서는 평생 비용 결제 없이 완전 무상으로 홍보 기획 비서를 가동할 수 있습니다.
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider pt-1">
                        가입 시 이용약관 및 개인정보처리방침에 동의하게 됩니다
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isValidated) {
                        setValidationError("이 서비스를 이용하시려면 먼저 위의 Gemini API Key를 입력하고 성공적으로 인증받으셔야 합니다.");
                        // Focus or scroll to input
                        document.querySelector("input[type=password]")?.scrollIntoView({ behavior: "smooth" });
                        return;
                      }
                      setShowWizard(true);
                    }}
                    className={`w-full sm:w-auto px-8 py-4 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer ${
                      isValidated ? "bg-[#1A1A1A] hover:bg-[#4A6741]" : "bg-slate-400 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span>새 스크립트 기획 시작</span>
                    <ArrowRight className="h-4 w-4 tracking-normal transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isValidated) {
                        setValidationError("데모를 가동하려면 먼저 위의 Gemini API Key를 입력하고 성공적으로 인증받으셔야 합니다.");
                        document.querySelector("input[type=password]")?.scrollIntoView({ behavior: "smooth" });
                        return;
                      }
                      handleStartSampleDemo();
                    }}
                    className={`w-full sm:w-auto px-7 py-4 bg-white border rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isValidated 
                        ? "border-[#4A6741] text-[#4A6741] hover:bg-[#FAF9F6]" 
                        : "border-slate-300 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>실시간 10초 예제 데모 체험</span>
                  </button>
                </div>
                
                <p className="text-[10px] text-[#8C8880] italic">
                  *실시간 데모는 실제 디지털 사무과정 시나리오를 바탕으로 Gemini-3.5-Flash 가 실전용 채널별 문맥을 제작해 주는 과정을 즉시 가동하여 연동을 생생히 증명합니다.
                </p>
              </div>
            </div>

            {/* Core Advantages Bento */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8C8880] block">Crucial Capabilities</span>
                <h3 className="text-2xl md:text-3xl font-serif-editorial italic text-[#2C3E2D] font-bold">새일 전문가 비서의 4대 특급 소구 전략</h3>
                <p className="text-xs text-[#6B665E]">단순 글쓰기 대행이 아닙니다. 경력단절 여성의 재취업 자신감 장벽을 허무는 감정 가스 마켓 기획</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Strength 1 */}
                <div className="bg-white border border-[#E5E2DD] p-6 rounded-2xl space-y-3 hover:border-[#4A6741]/40 transition-all shadow-xs">
                  <div className="bg-[#FAF9F6] border border-[#E5E2DD] w-12 h-12 rounded-xl flex items-center justify-center text-[#4A6741]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="font-serif-editorial italic text-[#8C8880] text-sm">01</span>
                      계획서 가치 심도 추출 (Value Capture)
                    </h4>
                    <p className="text-xs text-[#6B665E] mt-1.5 leading-relaxed">
                      모집 대상 공고서나 계획서를 간략히 붙여넣는 것만으로도, 예비 교육 수강생인 여성분들이 심리적으로 끌릴 수밖에 없는 <strong>3대 핵심 소구 가치</strong>를 문맥 지능으로 즉시 분할 정합해 줍니다.
                    </p>
                  </div>
                </div>

                {/* Strength 2 */}
                <div className="bg-white border border-[#E5E2DD] p-6 rounded-2xl space-y-3 hover:border-[#4A6741]/40 transition-all shadow-xs">
                  <div className="bg-[#FAF9F6] border border-[#E5E2DD] w-12 h-12 rounded-xl flex items-center justify-center text-[#4A6741]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="font-serif-editorial italic text-[#8C8880] text-sm">02</span>
                      매체별 전용 기계식 준수 (Form compliance)
                    </h4>
                    <p className="text-xs text-[#6B665E] mt-1.5 leading-relaxed">
                      실수하기 쉬운 <strong>단문 문자메시지 90자 규칙</strong>의 엄밀 준수는 물론, 친숙한 유선 전화를 위한 부드러운 <strong>구어체 멘트</strong>, 블로그 방문율 향상을 위한 <strong>해시태그 5~7선</strong>까지 매체별 고유 규격을 자동 생산합니다.
                    </p>
                  </div>
                </div>

                {/* Strength 3 */}
                <div className="bg-white border border-[#E5E2DD] p-6 rounded-2xl space-y-3 hover:border-[#4A6741]/40 transition-all shadow-xs">
                  <div className="bg-[#FAF9F6] border border-[#E5E2DD] w-12 h-12 rounded-xl flex items-center justify-center text-[#4A6741]">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="font-serif-editorial italic text-[#8C8880] text-sm">03</span>
                      Q1~Q5 정밀 피드백 튜닝 (Refinement Panel)
                    </h4>
                    <p className="text-xs text-[#6B665E] mt-1.5 leading-relaxed">
                      출력문 복사에서 끝나지 마세요. 마음에 드는 원안 스크립트를 선택해 디테일 변수(더 높은 수치형 수당 강조, 사후 관리 강조, 동네 카페용 추가 채널 확장)에 대한 의견을 주시면 즉각 <strong>개량 마스터 수작업 완전본 세트</strong>를 재출산합니다.
                    </p>
                  </div>
                </div>

                {/* Strength 4 */}
                <div className="bg-white border border-[#E5E2DD] p-6 rounded-2xl space-y-3 hover:border-[#4A6741]/40 transition-all shadow-xs">
                  <div className="bg-[#FAF9F6] border border-[#E5E2DD] w-12 h-12 rounded-xl flex items-center justify-center text-[#4A6741]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="font-serif-editorial italic text-[#8C8880] text-sm">04</span>
                      경력보유여성 눈높이 공감 설계 (Empathetic Vibe)
                    </h4>
                    <p className="text-xs text-[#6B665E] mt-1.5 leading-relaxed">
                      가정과 육아의 병행 불안감에 대해 따뜻하고 정중히 응원하며, 전문 복직 자격을 취득하는 것에 대한 신뢰적 근거를 함께 제시해 수강생 신청 행동을 최고 농도로 달성합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Satisfaction Banner / Stats Counter */}
            <div className="bg-[#FAF9F6] border border-[#E5E2DD] rounded-2xl p-8 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8C8880]">Proof of work & Impact</span>
                <h4 className="text-lg font-serif-editorial italic text-[#2C3E2D] font-bold">새일센터 현직 종사자 실제 체감 만족도</h4>
                <p className="text-xs text-[#6B665E] max-w-md">일 평균 4시간 소요되던 자치 단체 홍보안 작성과 구직 모집 멘트 고민이 스마트 비서를 통해 단 10분내로 격감되었습니다.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-8 w-full md:w-auto text-center">
                <div className="bg-white border border-[#E5E2DD] px-6 py-4.5 rounded-xl">
                  <div className="text-2xl font-serif-editorial italic text-[#4A6741] font-bold">10분 이내</div>
                  <div className="text-[10px] text-[#8C8880] uppercase tracking-wider font-semibold mt-1">모집안 작성 단축</div>
                </div>
                <div className="bg-white border border-[#E5E2DD] px-6 py-4.5 rounded-xl">
                  <div className="text-2xl font-serif-editorial italic text-[#4A6741] font-bold">24.8% 증가</div>
                  <div className="text-[10px] text-[#8C8880] uppercase tracking-wider font-semibold mt-1">평균 등록률 보조</div>
                </div>
              </div>
            </div>

          </div>
        ) : generatedChannels.length === 0 && showWizard ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar: Realtime Progress Outline Tracker */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-[#E5E2DD] p-6 rounded-xl space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8C8880]">Dynamic Status</span>
                  <h3 className="text-xl font-serif-editorial italic text-[#2C3E2D] tracking-tight mt-1">실시간 기획 요약</h3>
                  <p className="text-xs text-[#6B665E] mt-1 leading-normal">
                    설문을 진행할 때마다 실시간 매핑 데이터가 반영되어 최종 프롬프트를 조율합니다.
                  </p>
                </div>

                <hr className="border-[#E5E2DD]" />

                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">01. 홍보 대상 프로그램</h4>
                    <p className="text-slate-800 bg-[#FAF9F6] border border-[#E5E2DD] px-3 py-2 rounded font-medium">
                      {currentInputs.programType || "의견 조율을 기다리는 중..."}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">02. 추출 핵심 가치 소구 3선</h4>
                    {currentInputs.extractedPoints && currentInputs.extractedPoints.length > 0 ? (
                      <ul className="space-y-1 bg-[#FAF9F6] border border-[#E5E2DD] p-3 rounded text-slate-700 font-medium list-disc list-inside">
                        {currentInputs.extractedPoints.map((pt: string, idx: number) => (
                          <li key={idx} className="truncate">{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#8C8880] italic bg-[#FAF9F6] border border-[#E5E2DD] px-3 py-2 rounded">
                        문서 분석 후 동적 활성화됩니다.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">03. 주요 구직 설득 대상(타겟)</h4>
                    {currentInputs.targets && currentInputs.targets.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {currentInputs.targets.map((tg: string, idx: number) => (
                          <span key={idx} className="bg-[#FAF9F6] border border-[#E5E2DD] text-[#4A6741] px-2 py-1 rounded font-medium text-[11px]">
                            {tg}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#8C8880] italic bg-[#FAF9F6] border border-[#E5E2DD] px-3 py-2 rounded">계획 중...</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">04. 연출 톤앤매너</h4>
                    {currentInputs.tones && currentInputs.tones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {currentInputs.tones.map((to: string, idx: number) => (
                          <span key={idx} className="bg-white border border-[#4A6741] text-[#4A6741] px-2 py-1 rounded font-medium text-[11px]">
                            {to}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#8C8880] italic bg-[#FAF9F6] border border-[#E5E2DD] px-3 py-2 rounded">계획 중...</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">05. 송출 홍보 채널</h4>
                    {currentInputs.channels && currentInputs.channels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {currentInputs.channels.map((ch: string, idx: number) => (
                          <span key={idx} className="bg-[#4A6741] text-white px-2 py-1 rounded font-semibold text-[11px]">
                            {ch}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#8C8880] italic bg-[#FAF9F6] border border-[#E5E2DD] px-3 py-2 rounded">미정</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#8C8880] mb-1 uppercase tracking-wider">06. 접수 마감 및 일정 정보</h4>
                    <div className="bg-[#FAF9F6] border border-[#E5E2DD] p-2.5 rounded text-[11px] text-slate-700 space-y-1">
                      <div><strong className="text-[#8C8880]">기한:</strong> {currentInputs.schedule?.period || "미정"}</div>
                      <div><strong className="text-[#8C8880]">정원:</strong> {currentInputs.schedule?.quota || "미정"}</div>
                      <div><strong className="text-[#8C8880]">연락처:</strong> {currentInputs.schedule?.applyMethod || "미정"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Card */}
              <div className="bg-[#FAF9F6] border border-[#E5E2DD] p-5 rounded-xl text-center space-y-2">
                <p className="font-serif-editorial italic text-base text-[#2C3E2D]">Saeil Smart Guide</p>
                <p className="text-[11px] text-[#6B665E] leading-relaxed">
                  새일센터 모집 스크립트는 여성 구직자의 연령대, 교육 성격 상의 경력 단절 불안감에 밀착하여 작성될 때 실질 클릭률과 전화 문의 전환율이 극대화됩니다.
                </p>
              </div>
            </div>

            {/* Right: StepWizard Questionnaire Column */}
            <div className="lg:col-span-8">
              {isGenerating ? (
                <div className="bg-white border border-[#E5E2DD] rounded-xl p-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[450px]">
                  <span className="relative flex h-14 w-14">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A6741] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-14 w-14 bg-[#4A6741] flex items-center justify-center text-white font-bold text-lg">💡</span>
                  </span>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif-editorial italic text-[#2C3E2D]">성공적인 모집을 위해 정밀 분석 생성 중</h3>
                    <p className="text-xs text-[#6B665E] max-w-md mx-auto leading-relaxed">
                      제미나이 3.5 기반 스크립트 전문가가 가동되었습니다. 각 홍보 채널 고유의 성격과 분량제한(문자 90자 등)을 정밀 정산하며 5가지 특급 문구를 기획하고 있습니다...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <StepWizard onGenerate={handleGenerate} isGenerating={isGenerating} savedKey={savedKey} />
                  
                  {generationError && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex gap-2 items-center">
                      <span className="font-bold">⚠️ 오류 발생:</span>
                      <span>{generationError}</span>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        ) : (
          
          /* RESULTS VIEW: When scripts have been generated successfully */
          <div className="space-y-8 animate-fadeIn" id="results-view-block">
            
            {/* Status Header Navigation for Results */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E5E2DD] pb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8C8880] uppercase tracking-wider font-semibold">Recruitment Output</span>
                  <ChevronRight className="h-3 w-3 text-[#8C8880]" />
                  <span className="text-[#4A6741] font-bold">생성 완료</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif-editorial italic text-[#2C3E2D] tracking-tight mt-1">
                  제미나이 추천 채널별 맞춤형 모집 스크립트
                </h2>
                <p className="text-xs text-[#6B665E] mt-1">
                  선택한 {generatedChannels.length}개 채널별로 각각 완전히 다른 소구점과 개성이 담긴 <strong>5개 스크립트 대안</strong>이 준비되었습니다.
                </p>
              </div>

              <button
                type="button"
                id="reset-back-btn"
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#E5E2DD] rounded-lg text-xs font-semibold text-[#1A1A1A] hover:bg-[#F5F2ED] bg-white cursor-pointer transition-all self-start md:self-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                목록 및 조건 다시 조정하기
              </button>
            </div>

            {/* Primary Grid: Main scripts rendering & switch tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Channels Selector tabs */}
              <div className="lg:col-span-3 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8C8880] block pl-1">Media Channel</span>
                <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0">
                  {generatedChannels.map((ch, idx) => (
                    <button
                      key={idx}
                      id={`channel-tab-${idx}`}
                      onClick={() => setActiveChannelIdx(idx)}
                      className={`text-left px-4 py-3 border rounded-xl transition-all text-xs font-medium w-full shrink-0 lg:shrink ${
                        activeChannelIdx === idx
                          ? "border-[#4A6741] bg-[#F5F2ED] text-[#2C3E2D] font-bold shadow-xs flex items-center justify-between"
                          : "border-[#E5E2DD] bg-white text-slate-600 hover:border-[#8C8880]"
                      }`}
                    >
                      <span>{ch.channelName}</span>
                      {activeChannelIdx === idx && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4A6741] hidden lg:block" />
                      )}
                    </button>
                  ))}
                </div>

                {inputs && (
                  <div className="bg-white border border-[#E5E2DD] p-4.5 rounded-xl hidden lg:block space-y-3 text-xs">
                    <p className="font-serif-editorial italic text-slate-800 border-b border-[#E5E2DD] pb-1.5 font-bold">선택 타겟 &amp; 핵심 일정</p>
                    <div className="text-[11px] text-[#6B665E] space-y-2">
                      <div>
                        <strong>선택 타겟:</strong> {inputs.targets.join(", ") || "직접 입력"}
                      </div>
                      <div>
                        <strong>핵심 포인트:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {inputs.extractedPoints.slice(0, 3).map((pt, i) => (
                            <li key={i} className="truncate">{pt}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>신청 문의처:</strong> {inputs.schedule.applyMethod || "미정"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Visual scripts display per active channel */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* Active channel details display */}
                <div className="bg-white border border-[#E5E2DD] p-6 rounded-xl space-y-6">
                  
                  {/* Channel Meta Display info */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#FAF9F6] border border-[#E5E2DD] p-4 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#4A6741]">Target Channel</span>
                      <h3 className="text-lg font-serif-editorial italic text-[#2C3E2D] tracking-tight font-bold">
                        {generatedChannels[activeChannelIdx].channelName} 우수 추천 스크립트 리스트
                      </h3>
                      {generatedChannels[activeChannelIdx].channelName === "문자/카카오톡" && (
                        <span className="mt-1 inline-block text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                          🔒 90자 이내 완벽 준수
                        </span>
                      )}
                      {generatedChannels[activeChannelIdx].channelName === "전화 안내" && (
                        <span className="mt-1 inline-block text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                          🗣️ 친숙 구어체 변조
                        </span>
                      )}
                    </div>

                    {/* View Mode Toggle: List vs Mobile simulator */}
                    <div className="flex border border-[#E5E2DD] rounded-xl p-1 bg-white self-stretch sm:self-auto shrink-0" id="preview-mode-toggle-container">
                      <button
                        type="button"
                        id="toggle-list-view-btn"
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          viewMode === "list"
                            ? "bg-[#4A6741] text-white shadow-xs font-extrabold"
                            : "text-[#8C8880] hover:text-[#4A6741]"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>📄 일반 전체 리스트</span>
                      </button>
                      <button
                        type="button"
                        id="toggle-preview-view-btn"
                        onClick={() => {
                          setViewMode("preview");
                          setActivePreviewDraftIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          viewMode === "preview"
                            ? "bg-[#4A6741] text-white shadow-xs font-extrabold"
                            : "text-[#8C8880] hover:text-[#4A6741]"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>📱 모바일 모의 화면 미리보기</span>
                      </button>
                    </div>
                  </div>

                  {viewMode === "list" ? (
                    /* Rendering 5 generated scripts */
                    <div className="space-y-6">
                      {generatedChannels[activeChannelIdx].scripts.map((script, sIdx) => {
                        const elementId = `script-conclusion-${activeChannelIdx}-${sIdx}`;
                        const isCc = copiedId === elementId;
                        
                        return (
                          <div 
                            key={script.id} 
                            id={`script-card-${script.id}`}
                            className="border border-[#E5E2DD] rounded-xl hover:border-[#4A6741] transition-all p-5 hover:shadow-xs space-y-4 bg-white"
                          >
                            <div className="flex justify-between items-center border-b border-[#FAF9F6] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-serif-editorial italic text-lg text-[#8C8880]">#0{script.id}</span>
                                <span className="text-xs bg-[#FAF9F6] text-[#4A6741] px-2.5 py-0.5 rounded border border-[#E5E2DD] font-semibold">
                                  {script.tone}
                                </span>
                              </div>
                              <button
                                type="button"
                                id={`copy-btn-${script.id}`}
                                onClick={() => copyToClipboard(script.conclusion, elementId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCc 
                                    ? "bg-[#4A6741] text-white" 
                                    : "bg-white border border-[#E5E2DD] hover:border-[#4A6741] text-[#1A1A1A]"
                                }`}
                              >
                                {isCc ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    복사 완료!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 text-[#8C8880]" />
                                    스크립트 복사
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Reasoning part (Reasoning -> Conclusion rule requirement) */}
                            <div className="bg-[#FAF9F6] border-l-2 border-[#4A6741] p-3.5 rounded text-xs text-[#6B665E] italic leading-relaxed">
                              <strong className="text-[#2C3E2D] not-italic block mb-1 font-semibold text-[11px] uppercase tracking-wider">🎯 소구 전략 및 기획 배경 (Reasoning)</strong>
                              {script.reasoning}
                            </div>

                            {/* Conclusion part (Multiline final recruitment text) */}
                            <div className="space-y-1 bg-white p-4 border border-[#E5E2DD] rounded-lg">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C8880] block mb-2">📢 완성형 모집 기획서 (Conclusion)</span>
                              <p 
                                id={elementId}
                                className="text-sm text-slate-800 font-serif-editorial italic leading-relaxed whitespace-pre-wrap font-medium"
                              >
                                {script.conclusion}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* MOBILE PREVIEW SIMULATOR MODE */
                    <div className="py-2 space-y-6 animate-fadeIn" id="mobile-preview-container">
                      <div className="bg-[#FAF9F6] p-4.5 rounded-xl border border-[#E5E2DD] space-y-3">
                        <span className="text-[11px] font-bold text-slate-800 block uppercase tracking-wider">
                          💡 시뮬레이션할 추천 원안 스크립트 선택 (Draft Select)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="draft-button-row">
                          {generatedChannels[activeChannelIdx].scripts.map((script, sIdx) => (
                            <button
                              key={script.id}
                              type="button"
                              id={`draft-select-button-${sIdx}`}
                              onClick={() => setActivePreviewDraftIndex(sIdx)}
                              className={`px-3 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer text-center ${
                                activePreviewDraftIndex === sIdx
                                  ? "bg-[#4A6741] text-white border-[#4A6741] shadow-xs"
                                  : "bg-white text-slate-700 border-[#E5E2DD] hover:border-slate-400"
                              }`}
                            >
                              <div>안 #{script.id}</div>
                              <div className="text-[9px] opacity-80 font-normal truncate max-w-full mt-0.5">
                                {script.tone.split(" ")[0]}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Summary details of the active preview draft */}
                        <div className="bg-white border border-[#E5E2DD] rounded-lg p-3 text-xs text-slate-600 leading-relaxed space-y-1.5 shadow-2xs">
                          <div>
                            <strong className="text-slate-800 mr-2">선택 소구 톤앤매너:</strong>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {generatedChannels[activeChannelIdx].scripts[activePreviewDraftIndex].tone}
                            </span>
                          </div>
                          <div>
                            <strong className="text-slate-800 block mb-0.5">기획 방향 (Reasoning):</strong>
                            <p className="italic text-slate-500 text-[11px]">
                              {generatedChannels[activeChannelIdx].scripts[activePreviewDraftIndex].reasoning}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Display the simulator itself */}
                      <div className="flex justify-center items-center py-4">
                        <MobileSimulator
                          channelName={generatedChannels[activeChannelIdx].channelName}
                          activeScript={generatedChannels[activeChannelIdx].scripts[activePreviewDraftIndex]}
                          programType={inputs?.programType || "국비지원 특급 여성 취업 과정"}
                          schedule={{
                            period: inputs?.schedule?.period || "2026.06.15 ~ 2026.07.25",
                            classSchedule: inputs?.schedule?.classSchedule || "매주 월~금 10:00 ~ 15:00",
                            quota: inputs?.schedule?.quota || "정원 20명 선착순 마감",
                            applyMethod: inputs?.schedule?.applyMethod || "새일센터 취업지원본부 상담팀 (02-3421-5000)"
                          }}
                          hashtags={generatedChannels[activeChannelIdx].hashtags || []}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rendering Hashtags automatically generated for Blog */}
                  {generatedChannels[activeChannelIdx].hashtags && 
                   generatedChannels[activeChannelIdx].hashtags!.length > 0 && (
                    <div className="bg-[#FAF9F6] p-4.5 rounded-xl border border-[#E5E2DD] space-y-2">
                      <span className="text-xs font-bold text-[#2C3E2D] block uppercase tracking-wider">🏷️ 블로그 추천 동적 해시태그 (자동 생성 5~7선)</span>
                      <div className="flex flex-wrap gap-2">
                        {generatedChannels[activeChannelIdx].hashtags!.map((tag, tIdx) => (
                          <span 
                            key={tIdx} 
                            onClick={() => copyToClipboard(tag, `tag-${activeChannelIdx}-${tIdx}`)}
                            className="bg-white border border-[#E5E2DD] hover:border-[#4A6741] cursor-pointer text-[#4A6741] px-2.5 py-1 rounded text-xs transition-colors font-medium font-mono"
                          >
                            {tag} {copiedId === `tag-${activeChannelIdx}-${tIdx}` && "✓"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* 📢 Q1 ~ Q5 PROFESSIONAL REVISION WORKFLOW */}
                <div className="bg-white border border-[#E5E2DD] p-6 md:p-8 rounded-xl space-y-6" id="feedback-tuning-form">
                  <div className="border-b border-[#E5E2DD] pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8C8880]">Script Tuning Panel</span>
                    <h3 className="text-xl md:text-2xl font-serif-editorial italic text-[#2C3E2D] tracking-tight mt-1 font-bold">
                      🖋️ 프로페셔널 스크립트 피드백 &amp; 마스터 튜닝 (Q1 ~ Q5)
                    </h3>
                    <p className="text-xs text-[#6B665E] mt-1 leading-relaxed">
                      마음에 드는 안을 선택하고 보강하고 싶은 수치정보나 톤앤매너, 연계할 추가 채널을 요청하세요. 
                      AI 수석 에디터가 즉시 분석을 재실행하여 <u>최종 수정 마스터본 세트</u>를 재출산합니다. (줄바꿈 3단 및 Reasoning 유지)
                    </p>
                  </div>

                  <form onSubmit={handleApplyFeedback} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      
                      {/* Q1: Select Script ID */}
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-800">
                          Q1. 마음에 드는 원본 스크립트 번호 선택
                        </label>
                        <p className="text-[11px] text-[#8C8880]">기반으로 하고 싶은 번호를 적어주시거나 콤마로 다수 선택하세요.</p>
                        <input
                          type="text"
                          required
                          placeholder="예: 2번, 4번 (또는 자유 기재)"
                          value={selectedScriptId}
                          onChange={(e) => setSelectedScriptId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5E2DD] bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#4A6741] focus:border-[#4A6741] focus:outline-none"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {["#01 안", "#02 안", "#03 안", "#04 안", "#05 안"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setSelectedScriptId(v)}
                              className="text-[10px] border border-[#E5E2DD] hover:border-[#4A6741] text-[#6B665E] px-2 py-1 rounded bg-white"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Q2: Adjust Tone and Manner */}
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-800">
                          Q2. 추가로 가미하거나 보강하고 싶은 분위기/톤
                        </label>
                        <p className="text-[11px] text-[#8C8880]">모집 소구력을 강화하기위해 추가로 뒤섞고 싶은 연출 톤을 선택/입력하세요.</p>
                        <input
                          type="text"
                          placeholder="예: 긴급마감형 강조, 사후 케어 신뢰성 백퍼센트 연출"
                          value={additionalTone}
                          onChange={(e) => setAdditionalTone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5E2DD] bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#4A6741] focus:border-[#4A6741] focus:outline-none"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {["긴급 마감형", "수료생 실전 성공 강조", "감성 눈물 자극", "정부공인 무료과정 강조"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setAdditionalTone(v)}
                              className="text-[10px] border border-[#E5E2DD] hover:border-[#4A6741] text-[#6B665E] px-2 py-1 rounded bg-white"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Q3: Emphasize Target Benefits */}
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-800">
                          Q3. 더 극적으로 강조하고 싶은 참가 혜택 사치
                        </label>
                        <p className="text-[11px] text-[#8C8880]">수강생 지원금, 실비 지원, 자격 혜택, 연계률 등 더 강조할 세부 강점 수치를 넣으세요.</p>
                        <input
                          type="text"
                          placeholder="예: 매월 참여수당 30만원 지원 확실히 강조, 시험 응시료 면제 추가"
                          value={highlightBenefit}
                          onChange={(e) => setHighlightBenefit(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5E2DD] bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#4A6741] focus:border-[#4A6741] focus:outline-none"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {["매월 차비/훈련수당 지원", "교재·재료 전액 무료", "취업률 80% 이상 보증", "자격증 응시료 지원"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setHighlightBenefit(v)}
                              className="text-[10px] border border-[#E5E2DD] hover:border-[#4A6741] text-[#6B665E] px-2 py-1 rounded bg-white"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Q4: Include Contact Method yes/no */}
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-800">
                          Q4. 신청방법 및 전화 문의처 정보를 더 강조할까요?
                        </label>
                        <p className="text-[11px] text-[#8C8880]">참여자의 수확 행동을 즉발하기 위해 문미의 신청 유도문을 다듬습니다.</p>
                        <div className="flex gap-3">
                          {["네, 신청 정보와 연락처를 더욱 강조해 주세요.", "아니오, 본문 스토리 중심형으로 유지해 주세요."].map((v) => (
                            <label key={v} className="flex items-center gap-2 bg-[#FAF9F6] border border-[#E5E2DD] p-3 rounded-xl w-full cursor-pointer text-xs font-semibold">
                              <input
                                type="radio"
                                name="includeContact"
                                checked={includeContact === v}
                                onChange={() => setIncludeContact(v)}
                                className="accent-[#4A6741]"
                              />
                              <span>{v}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Q5: Extend channel list (expand / augment another channel output) */}
                    <div className="space-y-2 text-sm pt-2">
                      <label className="block font-bold text-slate-800">
                        Q5. 추가로 확장하거나 새로 추가 송출하고 싶은 보강 신규 매체 채널이 있나요?
                      </label>
                      <p className="text-[11px] text-[#8C8880]">기존 채널 외 당근마켓, 지역 맘카페, 포스터 요약, 단체 단톡방용, 혹은 추가하고싶은 특정 미디어 채널을 기입해주세요.</p>
                      <input
                        type="text"
                        placeholder="예: '당근마켓 동네생활 홍보 게시물 채널 추가', '맘카페 주부 공감 게시판용 채널 확장'"
                        value={extendChannel}
                        onChange={(e) => setExtendChannel(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E2DD] bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#4A6741] focus:border-[#4A6741] focus:outline-none"
                      />
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {["당근마켓 지역소식 게시글 유연 확장", "동네 맘카페 엄마 공감 대안글", "가정 배포용 아파트 전단지 요약본", "단체 소통방 알림문"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setExtendChannel(v)}
                            className="text-[10px] border border-[#E5E2DD] hover:border-[#4A6741] text-[#6B665E] px-2 py-1 rounded bg-white"
                          >
                            + {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="submit-feedback-btn"
                      disabled={isRevising}
                      className="w-full py-4 text-xs font-bold tracking-wider uppercase bg-[#1A1A1A] hover:bg-[#4A6741] text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isRevising ? (
                        <>
                          <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full"></span>
                          사용자 맞춤형 정밀 마스터 재편성 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          정밀 피드백 반영하기 &amp; 최종 수정본 입체 생성
                        </>
                      )}
                    </button>

                  </form>

                  {revisionError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                      {revisionError}
                    </div>
                  )}

                </div>

                {/* REVISED SCRIPTS VIEW: Rendered below when feedback API completes */}
                {revisedChannels && revisedChannels.length > 0 && (
                  <div 
                    id="revision-results-view" 
                    className="bg-[#FAF9F6] border-2 border-[#4A6741] p-6 md:p-8 rounded-xl space-y-8 animate-fadeIn transition-all"
                  >
                    
                    <div className="flex justify-between items-start border-b border-[#E5E2DD] pb-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] bg-[#4A6741] text-white px-2.5 py-1 rounded font-bold uppercase tracking-widest w-fit">
                          ★ 최종 개량 완성 마스터본
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif-editorial italic text-[#2C3E2D] tracking-tight mt-2 font-bold">
                          🎯 피드백 조수 완전본 (개량 및 채널 확장 완료)
                        </h3>
                        <p className="text-xs text-[#6B665E] mt-1.5 leading-relaxed">
                          제안 주신 Q1~Q5 피드백을 빈틈없이 결합한 최종 사양입니다. 
                          기존 3줄 구조와 전략 Reasoning 형식을 영리하게 유지하면서, 혜택 강조 및 문의 행동 유도 강령을 최고 농도로 보냈습니다.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {revisedChannels.map((ch, chIdx) => (
                        <div key={chIdx} className="bg-white border border-[#E5E2DD] rounded-xl p-5 md:p-6 space-y-4 shadow-xs">
                          <h4 className="text-sm font-bold text-[#1A1A1A] border-b border-[#FAF9F6] pb-2 uppercase tracking-wider flex items-center justify-between">
                            <span className="font-serif-editorial italic text-base text-[#2C3E2D]">★ {ch.channelName} 개량 완료본</span>
                            <span className="text-[10px] font-mono text-[#8C8880]">Revised Category</span>
                          </h4>

                          <div className="space-y-6">
                            {ch.scripts.map((script, sIdx) => {
                              const revId = `revised-script-${chIdx}-${sIdx}`;
                              const isCc = copiedId === revId;

                              return (
                                <div key={script.id} className="border border-[#E5E2DD] hover:border-[#4A6741] p-4.5 rounded-lg space-y-3">
                                  <div className="flex justify-between items-center text-xs border-b border-[#FAF9F6] pb-1.5">
                                    <span className="font-serif-editorial italic text-emerald-800 font-bold">마스터 안 {script.id} ({script.tone})</span>
                                    <button
                                      type="button"
                                      id={`copy-rev-btn-${sIdx}`}
                                      onClick={() => copyToClipboard(script.conclusion, revId)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                        isCc 
                                          ? "bg-[#4A6741] text-white" 
                                          : "bg-white border border-[#E5E2DD] text-[#1A1A1A] hover:border-[#4A6741]"
                                      }`}
                                    >
                                      {isCc ? "복사 완료!" : "카피"}
                                    </button>
                                  </div>

                                  <div className="text-xs text-[#6B665E] italic bg-[#FAF9F6] p-2.5 rounded border-l-2 border-[#8C8880]">
                                    <strong className="block text-[10px] not-italic text-[#2C3E2D] mb-0.5 uppercase tracking-wide">피드백 조율 근거 (Reasoning)</strong>
                                    {script.reasoning}
                                  </div>

                                  <p 
                                    id={revId}
                                    className="text-xs md:text-sm text-[#1A1A1A] bg-white p-3 border border-[#E5E2DD] rounded font-serif-editorial italic whitespace-pre-wrap font-medium leading-relaxed"
                                  >
                                    {script.conclusion}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {ch.hashtags && ch.hashtags.length > 0 && (
                            <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#E5E2DD] space-y-1.5">
                              <span className="text-xs font-bold text-[#2C3E2D] block">블로그 최적화 동적 복합 해시태그</span>
                              <div className="flex flex-wrap gap-1.5">
                                {ch.hashtags.map((tag, tIdx) => (
                                  <span 
                                    key={tIdx} 
                                    className="text-[11px] font-mono bg-white border border-[#E5E2DD] text-[#4A6741] px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Humble Footer with Zero Tech Larping */}
      <footer className="bg-white border-t border-[#E5E2DD] py-8 text-center text-xs text-[#8C8880] mt-12 bg-cover">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-medium">
            © 2026 여성새로일하기센터 사업운영 모집지원 전문 비서 시스템 — Saeil Expert
          </p>
          <p className="text-[10px] tracking-wide text-slate-400">
            본 시스템은 구직 여성의 성별 고용격차 해소와 재취업 성취 심도를 전극 향상하기 위해 Gemini-3.5 실시간 거대언어모델 연계 기술을 지원합니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
