export interface ProgramOption {
  id: number;
  label: string;
}

export interface TargetOption {
  id: number;
  label: string;
}

export interface ToneOption {
  id: number;
  label: string;
}

export interface ChannelOption {
  id: number;
  label: string;
  description: string;
}

export interface ScriptItem {
  id: number;
  tone: string;
  reasoning: string;
  conclusion: string; // Must be at least 3 lines with newlines
}

export interface ChannelScripts {
  channelName: string;
  scripts: ScriptItem[];
  hashtags?: string[]; // Recommended for Blog
}

export interface GenerationInput {
  programType: string;         // Preselected or direct text
  extractedPoints: string[];   // 3 points extracted from PDF/text
  targets: string[];           // Preselected or direct text
  tones: string[];             // Preselected or direct text
  channels: string[];          // Preselected or direct text
  schedule: {
    period: string;            // 예: ~ 7월 31일
    classSchedule: string;     // 예: 8월 5일 ~ 9월 30일, 매주 화·목 오전 10시
    quota: string;             // 예: 20명 선착순
    applyMethod: string;       // 예: 전화 055-000-0000 / 카카오톡 채널
  };
}

export interface FeedbackInput {
  selectedScriptId: string;     // Q1 마음에 드는 스크립트 번호 (콤마 구분 가능)
  additionalTone: string;       // Q2 추가하고 싶은 톤앤매너 번호/직접입력
  highlightBenefit: string;     // Q3 강조하고 싶은 참여 혜택 번호/직접입력
  includeContact: string;       // Q4 신청방법/문의처 정보 추가 여부 (네/아니오)
  extendChannel: string;        // Q5 다른 채널 확장 여부 번호/직접입력
}
