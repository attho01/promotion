import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  MessageSquare, 
  Phone, 
  Heart, 
  Send, 
  MoreHorizontal, 
  Smile, 
  MessageCircle, 
  Volume2, 
  Mic, 
  PhoneOff, 
  Bookmark, 
  Globe, 
  ExternalLink,
  Clipboard,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  UserCheck,
  Check
} from "lucide-react";

interface ScriptItem {
  id: number;
  tone: string;
  reasoning: string;
  conclusion: string;
}

interface MobileSimulatorProps {
  channelName: string;
  activeScript: ScriptItem;
  programType: string;
  schedule: {
    period: string;
    classSchedule: string;
    quota: string;
    applyMethod: string;
  };
  hashtags?: string[];
}

export default function MobileSimulator({
  channelName,
  activeScript,
  programType,
  schedule,
  hashtags = []
}: MobileSimulatorProps) {
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Auto-running logic for Call simulation counter
  useEffect(() => {
    let interval: any = null;
    if (channelName === "전화 안내") {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => (prev + 1) % 180); // loop after 3 mins
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [channelName, activeScript.id]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentText = activeScript.conclusion || "";
  const textLength = currentText.length;

  const handleCopySimulatorText = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. KakaoTalk & SMS Mode
  const renderKakaoTalkSim = () => {
    return (
      <div className="flex flex-col h-full bg-[#BACEE0] font-sans text-slate-900 overflow-hidden rounded-3xl" id="kakao-sim-root">
        {/* Top Status Area / Kakao Header */}
        <div className="bg-[#BACEE5]/80 backdrop-blur-md px-4 pt-8 pb-3 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-xs">공식</div>
            <span className="font-bold text-xs text-slate-800 tracking-tight">여성새일센터 알림톡</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#333]">
            <Globe className="h-3 w-3" />
            <span className="text-[10px] font-mono">가정·취업 지원</span>
          </div>
        </div>

        {/* Message Panel Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Yellow Highlight Card for official Kakao Channel */}
          <div className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs space-y-1.5 text-slate-700">
            <div className="flex items-center justify-between border-b pb-1 text-[10px] text-slate-500 font-bold">
              <span>알림톡 수신 확인</span>
              <span className="text-[#4A6741]">전화상담 02대행</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-800">
              새일센터 전문 비서가 실시간 검산한 본 스크립트는 <strong>단문 문자 90자 제한 및 카카오 채널 포맷</strong>에 맞추어 레이아웃이 정교하게 파싱되었습니다.
            </p>
          </div>

          <div className="flex gap-2 items-start mt-2">
            <div className="h-8 w-8 rounded-full bg-[#4A6741] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
              새일
            </div>
            <div className="space-y-1 w-full max-w-[82%]">
              <span className="text-[10px] text-slate-600 font-bold block ml-1">새로일하기 통합알림</span>
              
              {/* The styled yellow speech bubble */}
              <div className="bg-[#FAE100] text-[#1A1A1A] p-3.5 rounded-r-2xl rounded-bl-2xl shadow-xs leading-relaxed whitespace-pre-wrap text-xs font-semibold relative border border-yellow-300">
                {currentText}
                
                <span className="absolute bottom-1 right-2 text-[8px] text-slate-500 font-mono">
                  오후 2:15
                </span>
              </div>
              
              {/* Optional Apply Action Button decoration inside simulation */}
              <div className="bg-white border border-[#E5E2DD] rounded-xl overflow-hidden mt-1 text-center shadow-xs">
                <div className="p-2 bg-slate-50 text-[10px] font-semibold text-slate-800 border-b">
                  간편 모바일 수강 신청 접수
                </div>
                <div className="p-2 text-[10px] text-[#4A6741] font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <span>바로 문의하기</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Character Count & Compliance Meter Bar at Phone Bottom */}
        <div className="bg-white p-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            글자 수: <strong className="text-slate-800">{textLength}자</strong>
          </span>
          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold text-[10px]">
             90자 단문(SMS) 최적화 통과
          </span>
        </div>
      </div>
    );
  };

  // 2. Phone Call Mode
  const renderPhoneSim = () => {
    return (
      <div className="flex flex-col h-full bg-[#0D150D] text-[#E5E2DD] font-sans overflow-hidden rounded-3xl p-6 justify-between" id="phone-sim-root">
        {/* Top Dialer Status Header */}
        <div className="text-center pt-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/20 rounded-full text-[10px] text-[#55D683] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#55D683] animate-pulse" />
            <span>실시간 구어 상담 연출 중</span>
          </div>
          <h4 className="text-xl font-bold text-white tracking-tight leading-none mt-1">예비 주부 구직자 통화</h4>
          <p className="text-xs text-amber-100/70 font-medium">전화 상담용 비대면 에스코크 대화</p>
          <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/20 py-1 w-20 mx-auto rounded-md mt-1">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Teleprompter Scroll Screen */}
        <div className="flex-1 my-4 bg-black/40 border border-emerald-900/30 rounded-2xl p-4 overflow-y-auto space-y-4 max-h-[220px]">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            통화 권장 낭독 스크립트 (Teleprompter)
          </span>
          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap font-medium italic border-l border-emerald-800 pl-3">
            "{currentText}"
          </p>
          <p className="text-[10px] text-zinc-400 italic">
            * 새일센터 직업상담원의 인상 깊은 목소리 톤에 딱 맞춰 입체적인 침착과 다정함을 혼합하도록 설계되었습니다.
          </p>
        </div>

        {/* Phone Control Buttons (Call end) */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center text-[10px] text-zinc-400">
            <div className="bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer gap-1 transition-all">
              <Mic className="h-4 w-4 text-emerald-400" />
              <span>음소거</span>
            </div>
            <div className="bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer gap-1 transition-all">
              <Volume2 className="h-4 w-4 text-emerald-400" />
              <span>스피커</span>
            </div>
            <div className="bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer gap-1 transition-all">
              <MessageSquare className="h-4 w-4" />
              <span>메모지</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <PhoneOff className="h-4 w-4" />
            <span>수신 마감 및 통화 종료</span>
          </button>
        </div>
      </div>
    );
  };

  // 3. Instagram Style Mock
  const renderInstagramSim = () => {
    return (
      <div className="flex flex-col h-full bg-white font-sans text-slate-800 overflow-hidden rounded-3xl" id="insta-sim-root">
        {/* Header bar */}
        <div className="px-4 pt-8 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
              새
            </div>
            <div>
              <span className="font-bold text-[11px] block text-slate-900">saeil_job_center</span>
              <span className="text-[9px] text-slate-500 -mt-1 block">우리동네 스마트 새일</span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-slate-600" />
        </div>

        {/* Social Feed Graphic area */}
        <div className="flex-1 overflow-y-auto">
          {/* Card Image Area (Aesthetic Gradient with Title text) */}
          <div className="bg-gradient-to-br from-[#4A6741] to-[#2C3E2D] aspect-video w-full p-6 flex flex-col justify-between text-white relative">
            <div className="text-[9px] font-mono tracking-widest text-[#E5E2DD] uppercase">
              Woman Empowerment Project
            </div>
            
            <div className="space-y-1.5 py-4">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                경진단절여성 특급취업반
              </span>
              <h4 className="text-base font-serif-editorial italic font-bold leading-tight line-clamp-2">
                {programType || "여성 취업훈련 과정 교육생 모집"}
              </h4>
            </div>

            <div className="flex justify-between items-center text-[10px] border-t border-white/20 pt-2 text-slate-200">
              <div>정원: {schedule.quota || "20명 선착순"}</div>
              <div>문의: 새일센터 전담팀</div>
            </div>
          </div>

          {/* Engagement Icons */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex space-x-3 text-slate-800">
              <Heart className="h-4 w-4 hover:fill-red-500 hover:text-red-500 cursor-pointer" />
              <MessageCircle className="h-4 w-4 cursor-pointer" />
              <Send className="h-4 w-4 cursor-pointer" />
            </div>
            <Bookmark className="h-4 w-4 cursor-pointer" />
          </div>

          {/* Post Description */}
          <div className="px-3 pb-4 space-y-1.5 text-xs">
            <p className="text-slate-800 text-[10px]">
              좋아요 <strong>142개</strong>
            </p>
            <div className="leading-relaxed whitespace-pre-wrap text-[11px] text-slate-700">
              <span className="font-bold text-slate-900 mr-1.5">saeil_job_center</span> 
              {currentText}
            </div>
            
            {/* Displaying hashtags */}
            {hashtags && hashtags.length > 0 && (
              <div className="text-[10px] text-blue-600 font-medium flex flex-wrap gap-1">
                {hashtags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="hover:underline cursor-pointer">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 4. Naver Blog Style Mock
  const renderBlogSim = () => {
    return (
      <div className="flex flex-col h-full bg-[#FAF9F6] font-sans text-slate-800 overflow-hidden rounded-3xl" id="blog-sim-root">
        {/* Naver Blog Native Green Top Navigation Header */}
        <div className="bg-[#2DB400] text-white px-4 pt-8 pb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tighter">B</span>
            <span className="font-bold text-[11px] tracking-tight">공식블로그 소식지</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <span>이웃추가</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>

        {/* Blog Article Post Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1 text-center border-b pb-3 border-slate-200">
            <span className="text-[9px] text-[#2DB400] font-bold">국비전액무료 &amp; 취업 연계 전형</span>
            <h4 className="text-sm font-bold text-slate-900 leading-normal tracking-tight">
              {programType || "국비지원 전문 교육훈련 모집공고"}
            </h4>
            <span className="text-[8px] text-slate-400 font-mono block">2026. 05. 30 · 작성자 새일지원본부</span>
          </div>

          <div className="space-y-3 leading-relaxed text-[11px] text-slate-700">
            {/* Mini Informational Divider Box */}
            <div className="bg-white border rounded p-2.5 space-y-1 text-[10px] leading-normal italic text-slate-600">
              <strong className="text-slate-800 not-italic block uppercase tracking-wider text-[9px] text-[#2DB400]">💡 사업 개요 및 매개 조건</strong>
              <div>• 일정: {schedule.period || "미입력"}</div>
              <div>• 실 근무반편성: {schedule.classSchedule || "미입력"}</div>
              <div>• 문의접수처: {schedule.applyMethod || "미입력"}</div>
            </div>

            {/* Main content */}
            <p className="whitespace-pre-wrap font-serif-editorial text-xs italic text-slate-800 leading-relaxed font-semibold">
              {currentText}
            </p>
          </div>

          {/* Renders dynamic hashtags below */}
          {hashtags && hashtags.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[10px] text-slate-400 block mb-1">태그 리바운드 수집량</span>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((tag, i) => (
                  <span key={i} className="bg-white border text-xs text-slate-600 px-2 py-0.5 rounded text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Normal Social Post (Flyer and generic Facebook)
  const renderGenericSocialSim = () => {
    return (
      <div className="flex flex-col h-full bg-[#FAF9F6] font-sans text-slate-800 overflow-hidden rounded-3xl" id="generic-sim-root">
        {/* White header banner */}
        <div className="bg-white border-b border-slate-100 px-4 pt-8 pb-3 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800">새일 공식 협력 채널</span>
          <span className="text-[10px] font-bold text-[#4A6741]">포스터/소식</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white border border-[#E5E2DD] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-[10px] text-[#4A6741] font-semibold tracking-wider">RECRUITMENT BANNER</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-tight">{programType}</h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-serif-editorial italic font-medium">
              {currentText}
            </p>

            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">📌 모집 상세 가이드</div>
              <div>• 교육기간: {schedule.period}</div>
              <div>• 선발인원: {schedule.quota}</div>
              <div>• 상담문의: {schedule.applyMethod}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSimRenderer = () => {
    if (channelName === "문자/카카오톡") {
      return renderKakaoTalkSim();
    } else if (channelName === "전화 안내") {
      return renderPhoneSim();
    } else if (channelName === "Instagram") {
      return renderInstagramSim();
    } else if (channelName === "Blog") {
      return renderBlogSim();
    } else {
      return renderGenericSocialSim();
    }
  };

  return (
    <div className="space-y-4" id="mobile-simulator-layout-box">
      {/* Container holding smartphone case */}
      <div className="relative mx-auto w-[330px] h-[580px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl border-4 border-[#333333]">
        {/* Phone Notch/Ear speaker decoration */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-30 flex items-center justify-center">
          <div className="w-12 h-1 bg-[#222] rounded-full mr-2"></div>
          <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
        </div>

        {/* Home swipe indicator decoration */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-500 rounded-full z-30"></div>

        {/* Real phone screen output */}
        <div className="w-full h-full bg-white rounded-[32px] overflow-hidden border border-black/40">
          {getSimRenderer()}
        </div>
      </div>

      {/* Instant action block for ease of copy/use */}
      <div className="flex items-center justify-between bg-white border border-[#E5E2DD] p-4 rounded-2xl w-[330px] mx-auto shadow-xs">
        <div className="text-left">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#8C8880] block">Copy Channel Script</span>
          <span className="text-xs font-bold text-slate-800 truncate block max-w-[130px]">안 {activeScript.id} ({activeScript.tone})</span>
        </div>

        <button
          type="button"
          onClick={handleCopySimulatorText}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            copied
              ? "bg-[#4A6741] text-white"
              : "bg-[#F5F2ED] text-[#1A1A1A] hover:bg-[#E5E2DD]"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              복사 완료!
            </>
          ) : (
            <>
              <Clipboard className="h-3.5 w-3.5" />
              안 전체 복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}
