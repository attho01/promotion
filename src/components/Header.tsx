import { HeartHandshake } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-[#E0E6FC] py-4.5 px-6 shadow-xs sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#3C65F5] p-2.5 rounded-xl text-white shadow-md shadow-[#3C65F5]/10 animate-pulse-subtle">
            <HeartHandshake className="h-5.5 w-5.5" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#05264E] tracking-tight flex items-center gap-2">
              <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-[#3C65F5]">Saeil</span>
              <span className="font-medium text-lg md:text-xl text-[#05264E]">Expert</span>
              <span className="text-[9.5px] uppercase tracking-[0.15em] font-bold text-[#3C65F5] bg-[#E0E6FC]/50 border border-[#3C65F5]/20 px-2 py-0.5 rounded-md mt-0.5">
                Script Assistant v2.4
              </span>
            </h1>
            <p className="text-xs text-[#4F5E74] font-medium mt-0.5 leading-none">
              여성새로일하기센터(새일) 고객 참여 설득 및 채널별 모집 최적화 스크립트 작성 플랫폼
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 text-[10.5px] uppercase tracking-wide text-[#3C65F5] border border-[#3C65F5]/20 bg-[#E0E6FC]/30 px-3 py-1.5 rounded-xl self-start md:self-auto font-bold">
          <span className="h-2 w-2 rounded-full bg-[#3C65F5] animate-ping"></span>
          <span>Gemini-3.5-Flash Active</span>
        </div>
      </div>
    </header>
  );
}

