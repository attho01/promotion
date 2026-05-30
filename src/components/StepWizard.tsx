import React, { useState, useEffect } from "react";
import { PROGRAMS, TARGETS, TONES, CHANNELS } from "../constants";
import { GenerationInput } from "../types";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  X, 
  AlertCircle,
  HelpCircle,
  Clock,
  UserCheck,
  Megaphone
} from "lucide-react";

interface StepWizardProps {
  onGenerate: (data: GenerationInput) => void;
  isGenerating: boolean;
  savedKey: string | null;
}

export default function StepWizard({ onGenerate, isGenerating, savedKey }: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Form States
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [customProgram, setCustomProgram] = useState<string>("");
  
  // Step 2: Document / Benefit Input
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState<string>("");
  const [extractedPoints, setExtractedPoints] = useState<string[]>([
    "교육비 전액 무료 지원 및 교재 제공",
    "수료 후 1:1 맞춤형 취업 연계 및 사후 관리",
    "훈련 기간 내 정기적인 수당 / 교통비 지원"
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [pointInputs, setPointInputs] = useState<string[]>(["", "", ""]);
  const [useManualPoints, setUseManualPoints] = useState<boolean>(false);

  // Step 3: Targets
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [customTarget, setCustomTarget] = useState<string>("");

  // Step 4: Tones
  const [selectedToneIds, setSelectedToneIds] = useState<number[]>([]);
  const [customTone, setCustomTone] = useState<string>("");

  // Step 5: Channels
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [customChannel, setCustomChannel] = useState<string>("");

  // Step 6: Schedule & Quota
  const [period, setPeriod] = useState<string>("~ 7월 31일");
  const [classSchedule, setClassSchedule] = useState<string>("8월 5일 ~ 9월 30일, 매주 화·목 오전 10시");
  const [quota, setQuota] = useState<string>("20명 선착순");
  const [applyMethod, setApplyMethod] = useState<string>("전화 055-123-4567 / 방문 접수");

  const totalSteps = 6;

  // Synchronize state with window customEvent for sidebar preview
  useEffect(() => {
    let finalProgram = "";
    if (selectedProgramId) {
      const found = PROGRAMS.find(p => p.id === selectedProgramId);
      finalProgram = found ? found.label : "";
    }
    if (customProgram.trim()) {
      finalProgram = customProgram.trim();
    }

    const finalTargets: string[] = [];
    selectedTargetIds.forEach(id => {
      const found = TARGETS.find(t => t.id === id);
      if (found) finalTargets.push(found.label);
    });
    if (customTarget.trim()) {
      finalTargets.push(customTarget.trim());
    }

    const finalTones: string[] = [];
    selectedToneIds.forEach(id => {
      const found = TONES.find(t => t.id === id);
      if (found) finalTones.push(found.label);
    });
    if (customTone.trim()) {
      finalTones.push(customTone.trim());
    }

    const finalChannels: string[] = [];
    selectedChannelIds.forEach(id => {
      const found = CHANNELS.find(c => c.id === id);
      if (found) finalChannels.push(found.label);
    });
    if (customChannel.trim()) {
      finalChannels.push(customChannel.trim());
    }

    const finalPoints = useManualPoints 
      ? pointInputs.filter(p => p.trim() !== "")
      : extractedPoints;

    const event = new CustomEvent("wizard-state-change", {
      detail: {
        programType: finalProgram,
        extractedPoints: finalPoints,
        targets: finalTargets,
        tones: finalTones,
        channels: finalChannels,
        schedule: {
          period,
          classSchedule,
          quota,
          applyMethod
        }
      }
    });
    window.dispatchEvent(event);
  }, [
    selectedProgramId, 
    customProgram, 
    selectedTargetIds, 
    customTarget, 
    selectedToneIds, 
    customTone, 
    selectedChannelIds, 
    customChannel, 
    extractedPoints, 
    pointInputs, 
    useManualPoints,
    period,
    classSchedule,
    quota,
    applyMethod
  ]);

  // File Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    await analyzeDocument(file, docDescription);
  };

  const triggerAnalyzeWithText = async () => {
    if (!docDescription.trim()) {
      setAnalysisError("프로그램 설명이나 주요 특징을 먼저 입력해 주세요.");
      return;
    }
    await analyzeDocument(null, docDescription);
  };

  const analyzeDocument = async (file: File | null, textDesc: string) => {
    setIsAnalyzing(true);
    setAnalysisError("");
    
    try {
      let fileData = "";
      let mimeType = "";
      let fileName = "";

      if (file) {
        fileName = file.name;
        mimeType = file.type;
        
        // Read file as Base64 safely
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      const headers: any = { "Content-Type": "application/json" };
      if (savedKey) {
        headers["x-gemini-api-key"] = savedKey;
      }

      const res = await fetch("/api/analyze-doc", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fileData,
          fileName,
          mimeType,
          descriptionText: textDesc
        })
      });

      const data = await res.json();
      if (data.success && data.points && data.points.length > 0) {
        setExtractedPoints(data.points);
        setUseManualPoints(false);
      } else {
        throw new Error(data.error || "포인트를 추출하지 못했습니다. 기본 설정값을 사용하거나 직접 명쾌하게 수정할 수 있습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "문서 분석에 실패하여 기본 혜택을 제공합니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Target multi-select togglers
  const toggleTarget = (id: number) => {
    if (selectedTargetIds.includes(id)) {
      setSelectedTargetIds(selectedTargetIds.filter(val => val !== id));
    } else {
      setSelectedTargetIds([...selectedTargetIds, id]);
    }
  };

  const toggleTone = (id: number) => {
    if (selectedToneIds.includes(id)) {
      setSelectedToneIds(selectedToneIds.filter(val => val !== id));
    } else {
      setSelectedToneIds([...selectedToneIds, id]);
    }
  };

  const toggleChannel = (id: number) => {
    if (selectedChannelIds.includes(id)) {
      setSelectedChannelIds(selectedChannelIds.filter(val => val !== id));
    } else {
      setSelectedChannelIds([...selectedChannelIds, id]);
    }
  };

  // Assemble and Submit
  const handleFinish = () => {
    // Collect program name
    let finalProgram = "";
    if (selectedProgramId) {
      const found = PROGRAMS.find(p => p.id === selectedProgramId);
      finalProgram = found ? found.label : "";
    }
    if (customProgram.trim()) {
      finalProgram = customProgram.trim();
    }
    if (!finalProgram) {
      alert("프로그램명을 입력하거나 선택해 주세요.");
      setCurrentStep(1);
      return;
    }

    // Collect Targets
    const finalTargets: string[] = [];
    selectedTargetIds.forEach(id => {
      const found = TARGETS.find(t => t.id === id);
      if (found) finalTargets.push(found.label);
    });
    if (customTarget.trim()) {
      finalTargets.push(customTarget.trim());
    }
    if (finalTargets.length === 0) {
      alert("모집 대상을 최소 하나 선택하거나 직접 입력해 주세요.");
      setCurrentStep(3);
      return;
    }

    // Collect Tones
    const finalTones: string[] = [];
    selectedToneIds.forEach(id => {
      const found = TONES.find(t => t.id === id);
      if (found) finalTones.push(found.label);
    });
    if (customTone.trim()) {
      finalTones.push(customTone.trim());
    }
    if (finalTones.length === 0) {
      alert("스크립트 분위기(톤앤매너)를 최소 하나 선택해 주세요.");
      setCurrentStep(4);
      return;
    }

    // Collect Channels
    const finalChannels: string[] = [];
    selectedChannelIds.forEach(id => {
      const found = CHANNELS.find(c => c.id === id);
      if (found) finalChannels.push(found.label);
    });
    if (customChannel.trim()) {
      finalChannels.push(customChannel.trim());
    }
    if (finalChannels.length === 0) {
      alert("원하시는 홍보 채널을 최소 하나 선택해 주세요.");
      setCurrentStep(5);
      return;
    }

    // Key points
    const finalPoints = useManualPoints 
      ? pointInputs.filter(p => p.trim() !== "")
      : extractedPoints;

    onGenerate({
      programType: finalProgram,
      extractedPoints: finalPoints.length > 0 ? finalPoints : extractedPoints,
      targets: finalTargets,
      tones: finalTones,
      channels: finalChannels,
      schedule: {
        period,
        classSchedule,
        quota,
        applyMethod
      }
    });
  };

  const nextStep = () => {
    // Simple validation per step
    if (currentStep === 1) {
      let currentProg = "";
      if (selectedProgramId) {
        const found = PROGRAMS.find(p => p.id === selectedProgramId);
        if (found) currentProg = found.label;
      }
      if (customProgram.trim()) currentProg = customProgram.trim();

      if (!currentProg) {
        alert("프로그램명을 선택하거나 직접 입력해주셔야 다음 단계로 전환할 수 있습니다.");
        return;
      }
    }
    
    if (currentStep === 3 && selectedTargetIds.length === 0 && !customTarget.trim()) {
      alert("모집 타겟층을 최소 하나 선택하거나 직접 입력해 주세요.");
      return;
    }
    if (currentStep === 4 && selectedToneIds.length === 0 && !customTone.trim()) {
      alert("글쓰기 톤앤매너를 하나 이상 정해주셔야 보정 모델이 작성 기법을 파악합니다.");
      return;
    }
    if (currentStep === 5 && selectedChannelIds.length === 0 && !customChannel.trim()) {
      alert("홍보 채널을 1개 이상 지정해 주셔야 규격 제한(90자 등)에 맞춰 작성합니다.");
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E0E6FC] shadow-xl shadow-[#3C65F5]/4 p-6 md:p-10 max-w-4xl mx-auto my-6" id="wizard-container">
      {/* Step Indicator Headers */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[11px] bg-[#E0E6FC]/60 text-[#3C65F5] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-[#3C65F5]/10 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3C65F5] animate-pulse"></span>
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === i + 1 
                    ? "w-8 bg-[#3C65F5] shadow-xs shadow-[#3C65F5]/30" 
                    : currentStep > i + 1 
                      ? "w-4 bg-[#05264E]/70" 
                      : "w-2 bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Title corresponding to steps */}
        {currentStep === 1 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            01. 어떤 프로그램을 홍보하고 싶으신가요?
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              새일센터에서 진행하는 핵심 사업/교육 프로그램을 선택해 주세요. (구직자 맞춤형 연계에 최적화된 추천 목록)
            </span>
          </h2>
        )}
        {currentStep === 2 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            02. 관련 문서 업로드 및 혜택 자료 분석
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              훈련계획서/설명자료를 바탕으로 AI가 구직 여성용 핵심 소구 포인트 3가지를 자동으로 추출합니다.
            </span>
          </h2>
        )}
        {currentStep === 3 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            03. 누구를 대상으로 한 모집 광고인가요?
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              참여를 희망하는 핵심 목표 고객층(타겟)을 복수 선택하거나 직접 작성해주세요.
            </span>
          </h2>
        )}
        {currentStep === 4 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            04. 작성할 홍보 메시지의 톤앤매너 설정
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              경력보유여성의 마음을 포근하면서도 강력하게 설득할 문체 분위기를 설정합니다.
            </span>
          </h2>
        )}
        {currentStep === 5 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            05. 홍보를 진행할 스크립트 채널 선택
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              홍보가 예정된 미디어 및 전단/상담 플랫폼 채널을 정해 주세요.
            </span>
          </h2>
        )}
        {currentStep === 6 && (
          <h2 className="text-xl md:text-2xl font-extrabold text-[#05264E] tracking-tight leading-snug">
            06. 모집 정원 및 상세 일정 등록
            <span className="block text-xs font-normal text-[#4F5E74] font-sans mt-2 tracking-wide uppercase">
              참여 신청을 유도할 수 있도록 실제 마감 시간과 연락처 정보를 기재해 주세요.
            </span>
          </h2>
        )}
      </div>

      <hr className="border-[#E0E6FC] my-5" />

      {/* Step Content */}
      <div className="min-h-[290px]">
        {/* Step 1: Program Name */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROGRAMS.map((p, idx) => {
                const colors = [
                  "bg-blue-50 text-blue-600",
                  "bg-indigo-50 text-indigo-600",
                  "bg-sky-50 text-sky-600",
                  "bg-violet-50 text-[#3C65F5]",
                  "bg-purple-50 text-purple-600",
                  "bg-teal-50 text-teal-600",
                  "bg-rose-50 text-rose-600",
                ];
                const emojis = ["💼", "💬", "🔄", "📈", "🚀", "💻", "🎓"];
                const pickColor = colors[idx % colors.length];
                const pickEmoji = emojis[idx % emojis.length];

                return (
                  <button
                    key={p.id}
                    id={`program-btn-${p.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedProgramId(p.id);
                      setCustomProgram("");
                    }}
                    className={`text-left p-4.5 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer group ${
                      selectedProgramId === p.id && !customProgram
                        ? "border-[#3C65F5] bg-[#F5F7FF] text-[#05264E] font-bold ring-2 ring-[#3C65F5]/10 shadow-sm"
                        : "border-[#E0E6FC] hover:border-[#3C65F5] text-slate-700 bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl font-bold text-lg flex items-center justify-center shrink-0 ${pickColor} border border-slate-100 group-hover:scale-105 transition-transform`}>
                      {pickEmoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-[#4F5E74] font-bold tracking-wide uppercase">Saeil Category 0{p.id}</div>
                      <div className="text-[13.5px] font-bold text-[#05264E] mt-0.5">{p.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                지정 문항 외 프로그램명 직접 기입 (기타)
              </label>
              <input
                type="text"
                id="custom-program-input"
                placeholder="예: 경력단절예방 워크숍, 4050 여성 재도약 교실..."
                value={customProgram}
                onChange={(e) => {
                  setCustomProgram(e.target.value);
                  setSelectedProgramId(null);
                }}
                className="w-full px-4 py-3.5 rounded-2xl border border-[#E0E6FC] focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-xs font-medium bg-white transition-colors text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Step 2: Extracting Benefits (PDF analysis) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 bg-[#F5F7FF] rounded-2xl border border-[#E0E6FC] flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-[#3C65F5] p-2.5 rounded-xl text-white shrink-0 shadow-sm">
                <FileText className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="font-extrabold text-[#05264E] text-sm md:text-base">훈련계획서 및 유인 요소 분석</p>
                <p className="text-[11.5px] text-[#4F5E74] leading-relaxed font-medium">
                  프로그램 안내문이나 PDF 문서를 입력하면, AI가 참여를 고민 중인 여성 구직자들을 매료시킬 <strong>설득 가치 혜택 3선</strong>을 자동으로 추출하여 적용합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                    방법 A. 계획서 또는 관련 PDF 업로드
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E0E6FC] hover:border-[#3C65F5] rounded-2xl p-6.5 bg-[#F8F9FC] hover:bg-white cursor-pointer transition-all">
                    <Upload className="h-6 w-6 text-[#3C65F5]/70 mb-2 shrink-0" />
                    <span className="text-xs font-bold text-[#05264E] text-center px-2">
                      {docFile ? docFile.name : "클릭하여 PDF/문서파일 열기"}
                    </span>
                    <span className="text-[10px] text-[#4F5E74] mt-1.5 font-medium">PDF, 이미지, 텍스트 형태 지원</span>
                    <input 
                      type="file" 
                      id="pdf-uploader"
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                    방법 B. 프로그램 설명 직접 기입
                  </label>
                  <textarea
                    id="doc-desc-textarea"
                    rows={4}
                    placeholder="교육내용, 혜택, 참여 조건 등을 자유롭게 붙여넣기 해주세요. 입력 후 하단의 버튼을 눌러주세요."
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-2xl border border-[#E0E6FC] bg-white focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-slate-700 placeholder-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    id="analyze-text-btn"
                    onClick={triggerAnalyzeWithText}
                    className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#3C65F5] hover:bg-[#05264E] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-[#3C65F5]/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    작성글 기반 AI 분석 추출 실행
                  </button>
                </div>
              </div>

              {/* Extraction Results */}
              <div className="bg-[#F8F9FC] p-5 rounded-2xl border border-[#E0E6FC] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 border-b border-[#E0E6FC] pb-2">
                    <span className="text-xs font-extrabold text-[#05264E] flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="h-4 w-4 text-[#3C65F5] animate-pulse" />
                      핵심 가치 소구 혜택 3선
                    </span>
                    <button
                      type="button"
                      id="toggle-manual-btn"
                      onClick={() => setUseManualPoints(!useManualPoints)}
                      className="text-[10px] text-[#3C65F5] hover:underline font-extrabold"
                    >
                      {useManualPoints ? "추출 결과 보기" : "직접 정밀 입력하기"}
                    </button>
                  </div>

                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-14 space-y-3">
                      <span className="relative flex h-8 w-8">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3C65F5]/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-8 w-8 bg-[#3C65F5]"></span>
                      </span>
                      <p className="text-xs font-bold text-slate-600 animate-pulse">
                        제미나이가 핵심 설득 포인트를 정립하고 있습니다...
                      </p>
                    </div>
                  ) : useManualPoints ? (
                    <div className="space-y-3">
                      {pointInputs.map((val, idx) => (
                        <div key={idx}>
                          <label className="text-[10px] font-bold text-[#4F5E74]">공인 혜택 {idx + 1}</label>
                          <input
                            type="text"
                            placeholder="혜택 내용을 직접 입력해 주세요."
                            value={val}
                            onChange={(e) => {
                              const copy = [...pointInputs];
                              copy[idx] = e.target.value;
                              setPointInputs(copy);
                            }}
                            className="w-full text-xs p-2.5 rounded-xl border border-[#E0E6FC] bg-white mt-0.5 focus:border-[#3C65F5] focus:outline-none focus:ring-1 focus:ring-[#3C65F5]/10 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {extractedPoints.map((point, i) => (
                        <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-white border border-[#E0E6FC] hover:shadow-2xs transition-shadow">
                          <CheckCircle2 className="h-4 w-4 text-[#3C65F5] shrink-0 mt-0.5" />
                          <p className="text-xs text-[#05264E] leading-relaxed font-bold">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {analysisError && (
                    <div className="mt-3 text-[10px] text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{analysisError}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-[#E0E6FC] text-[10px] text-[#4F5E74] font-medium leading-relaxed">
                  ※ 수집된 수강비 면제, 자격 연계, 취업지원 정보를 판독하여 고도 설득 문학적 스크립트에 정초합니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Targets */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGETS.map((t, idx) => {
                const emojis = ["👩", "🍼", "🎯", "🔄", "💡", "⚡", "👵"];
                const colors = [
                  "bg-rose-50 text-rose-500",
                  "bg-sky-50 text-sky-500",
                  "bg-indigo-50 text-indigo-500",
                  "bg-teal-50 text-teal-500",
                  "bg-amber-50 text-amber-500",
                  "bg-cyan-50 text-cyan-500",
                  "bg-emerald-50 text-emerald-500",
                ];
                const pickEmoji = emojis[idx % emojis.length];
                const pickColor = colors[idx % colors.length];

                return (
                  <button
                    key={t.id}
                    id={`target-btn-${t.id}`}
                    type="button"
                    onClick={() => toggleTarget(t.id)}
                    className={`text-left p-4.5 rounded-2xl border transition-all flex justify-between items-center cursor-pointer group ${
                      selectedTargetIds.includes(t.id)
                        ? "border-[#3C65F5] bg-[#F5F7FF] text-[#05264E] font-bold shadow-sm shadow-[#3C65F5]/5"
                        : "border-[#E0E6FC] hover:border-[#3C65F5] text-slate-700 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 border border-slate-50 ${pickColor} group-hover:scale-105 transition-transform`}>
                        {pickEmoji}
                      </div>
                      <div>
                        <div className="text-[10px] text-[#4F5E74] font-bold tracking-wider">TARGET AUDIENCE</div>
                        <div className="text-[13px] font-bold text-[#05264E] mt-0.5">{t.label}</div>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      selectedTargetIds.includes(t.id)
                        ? "bg-[#3C65F5] border-[#3C65F5] text-white"
                        : "border-[#E0E6FC] bg-white text-transparent"
                    }`}>
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                목록 외 모집 타겟 직접 입력 (콤마나 한글 기입)
              </label>
              <input
                type="text"
                id="custom-target-input"
                placeholder="예: 영유아 자녀를 둔 연소자 엄마, 컴퓨터 조작 미숙 여성 등"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-[#E0E6FC] focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-xs font-medium bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Step 4: Tones */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TONES.map((t, idx) => {
                const emojis = ["🥰", "🚨", "✨", "📊", "🏆", "📖", "💬"];
                const colors = [
                  "bg-orange-50 text-orange-500",
                  "bg-red-50 text-red-500",
                  "bg-yellow-50 text-yellow-600",
                  "bg-blue-50 text-blue-500",
                  "bg-violet-50 text-[#3C65F5]",
                  "bg-purple-50 text-purple-500",
                  "bg-slate-50 text-slate-500",
                ];
                const pickEmoji = emojis[idx % emojis.length];
                const pickColor = colors[idx % colors.length];

                return (
                  <button
                    key={t.id}
                    id={`tone-btn-${t.id}`}
                    type="button"
                    onClick={() => toggleTone(t.id)}
                    className={`text-left p-4.5 rounded-2xl border transition-all flex justify-between items-center cursor-pointer group ${
                      selectedToneIds.includes(t.id)
                        ? "border-[#3C65F5] bg-[#F5F7FF] text-[#05264E] font-bold shadow-sm"
                        : "border-[#E0E6FC] hover:border-[#3C65F5] text-slate-700 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 border border-slate-50 ${pickColor} group-hover:scale-105 transition-transform`}>
                        {pickEmoji}
                      </div>
                      <div>
                        <div className="text-[10px] text-[#4F5E74] font-bold tracking-wider">TONE &amp; STYLE 0{idx+1}</div>
                        <div className="text-[13px] font-bold text-[#05264E] mt-0.5">{t.label}</div>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      selectedToneIds.includes(t.id)
                        ? "bg-[#3C65F5] border-[#3C65F5] text-white"
                        : "border-[#E0E6FC] bg-white text-transparent"
                    }`}>
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                원하는 톤앤매너 분위기 직접 작성
              </label>
              <input
                type="text"
                id="custom-tone-input"
                placeholder="예: 신뢰도 높은 공문서 스타일, 극적인 드라마 공감형 등"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-[#E0E6FC] focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-xs font-medium bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Step 5: Channels */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHANNELS.map((c, idx) => {
                const emojis = ["💬", "📞", "👥", "📸", "📝", "📰", "🚩"];
                const colors = [
                  "bg-amber-100 text-amber-700",
                  "bg-emerald-50 text-emerald-600",
                  "bg-blue-50 text-blue-600",
                  "bg-rose-50 text-rose-500",
                  "bg-teal-50 text-teal-600",
                  "bg-slate-50 text-slate-600",
                  "bg-indigo-50 text-indigo-600",
                ];
                const pickEmoji = emojis[idx % emojis.length];
                const pickColor = colors[idx % colors.length];

                return (
                  <button
                    key={c.id}
                    id={`channel-btn-${c.id}`}
                    type="button"
                    onClick={() => toggleChannel(c.id)}
                    className={`text-left p-4.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                      selectedChannelIds.includes(c.id)
                        ? "border-[#3C65F5] bg-[#F5F7FF] text-[#05264E] font-bold ring-2 ring-[#3C65F5]/10 shadow-sm"
                        : "border-[#E0E6FC] hover:border-[#3C65F5] text-slate-700 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center border border-slate-50 ${pickColor} group-hover:scale-105 transition-transform`}>
                        {pickEmoji}
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedChannelIds.includes(c.id)
                          ? "bg-[#3C65F5] border-[#3C65F5] text-white"
                          : "border-[#E0E6FC] text-transparent"
                      }`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-[9px] uppercase tracking-wider text-[#4F5E74] font-bold">MEDIA STAGE 0{idx+1}</span>
                      <h4 className="font-bold text-[14px] text-[#05264E] mt-0.5">{c.label}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">{c.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#4F5E74] uppercase tracking-wide mb-2">
                지정 채널 외 기타 채널 직접입력
              </label>
              <input
                type="text"
                id="custom-channel-input"
                placeholder="예: 당근마켓 동네생활 홍보대안글, 지역 맘카페 광고문"
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-[#E0E6FC] focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-xs font-medium bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Step 6: Dates, Quota, Form Submit */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4.5 bg-[#F5F7FF] border border-[#E0E6FC] rounded-2xl text-[11.5px] text-[#05264E] leading-relaxed flex gap-3 items-start">
              <AlertCircle className="h-4.5 w-4.5 text-[#3C65F5] shrink-0 mt-0.5" />
              <span className="font-medium">
                여기에 작성된 날짜와 문의 번호, 정원 조건은 <strong>AI가 만드는 스크립트의 3단 완결 구어 문장(Conclusion 셋째 줄)</strong>에 긴장감을 배가해 즉각적인 지원을 이끌어 낼 수 있도록 긴밀하게 반영됩니다.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#05264E] mb-1.5">
                  모집 기간 (마감일)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">📅</span>
                  <input
                    type="text"
                    id="period-input"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl border border-[#E0E6FC] bg-white focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-slate-700 font-bold"
                    placeholder="예: ~ 7월 31일 (미정이면 '미정')"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#05264E] mb-1.5">
                  교육/상담 진행 일정 설명
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">⏰</span>
                  <input
                    type="text"
                    id="class-schedule-input"
                    value={classSchedule}
                    onChange={(e) => setClassSchedule(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl border border-[#E0E6FC] bg-white focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-slate-700 font-bold"
                    placeholder="예: 8월 5일 ~ 9월 30일 매주 화·목"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#05264E] mb-1.5">
                  모집 정원 (선착순 등 강조용)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">👥</span>
                  <input
                    type="text"
                    id="quota-input"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl border border-[#E0E6FC] bg-white focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-slate-700 font-bold"
                    placeholder="예: 20명 정원 마감"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#05264E] mb-1.5">
                  참여 신청 방법 및 접수 문의처
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">☎️</span>
                  <input
                    type="text"
                    id="apply-method-input"
                    value={applyMethod}
                    onChange={(e) => setApplyMethod(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl border border-[#E0E6FC] bg-white focus:outline-none focus:ring-2 focus:ring-[#3C65F5]/10 focus:border-[#3C65F5] text-slate-700 font-bold"
                    placeholder="예: 방문 또는 전화 055-000-0000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-[#E0E6FC] my-6" />

      {/* Button Toolbars */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          id="prev-btn"
          onClick={prevStep}
          disabled={currentStep === 1 || isGenerating}
          className={`flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold border transition-all ${
            currentStep === 1 || isGenerating
              ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50"
              : "border-[#E0E6FC] text-[#05264E] hover:bg-slate-50 cursor-pointer bg-white"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          이전 단계
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            id="next-btn"
            onClick={nextStep}
            className="flex items-center gap-1.5 bg-[#3C65F5] hover:bg-[#05264E] text-white px-6 py-3.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-sm shadow-[#3C65F5]/15"
          >
            다음 단계
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            id="generate-btn"
            onClick={handleFinish}
            disabled={isGenerating}
            className={`flex items-center gap-2 bg-[#3C65F5] hover:bg-[#05264E] text-white px-7 py-3.5 rounded-xl text-xs font-extrabold shadow-md shadow-[#3C65F5]/15 hover:-translate-y-0.5 transition-all cursor-pointer ${
              isGenerating ? "opacity-60 cursor-not-allowed animate-pulse" : ""
            }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full"></span>
                실시간 컨설팅 스크립트 세트 제조 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                모집 스크립트 세트 생성하기
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
