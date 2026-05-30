import { ProgramOption, TargetOption, ToneOption, ChannelOption } from "./types";

export const PROGRAMS: ProgramOption[] = [
  { id: 1, label: "직업훈련 프로그램" },
  { id: 2, label: "취업상담 서비스" },
  { id: 3, label: "경력단절여성 재취업 지원" },
  { id: 4, label: "직무역량강화 교육" },
  { id: 5, label: "창업 준비 지원 프로그램" },
  { id: 6, label: "디지털·IT 직무 교육" },
  { id: 7, label: "국가자격증 취득 과정" },
];

export const TARGETS: TargetOption[] = [
  { id: 1, label: "경력단절여성 (퇴직·휴직 후 구직 희망자)" },
  { id: 2, label: "육아 후 복귀 희망 여성" },
  { id: 3, label: "취업 준비 중인 미취업 여성" },
  { id: 4, label: "직무전환을 희망하는 재직 여성" },
  { id: 5, label: "창업을 준비 중인 여성" },
  { id: 6, label: "디지털·IT 역량을 키우고 싶은 여성" },
  { id: 7, label: "50대 이상 중장년 여성 구직자" },
];

export const TONES: ToneOption[] = [
  { id: 1, label: "친근·공감형 (따뜻하고 편안한 말투)" },
  { id: 2, label: "긴급·행동유도형 (마감 임박, 서두르게 하는 말투)" },
  { id: 3, label: "희망·동기부여형 (변화와 가능성을 강조하는 말투)" },
  { id: 4, label: "정보전달·신뢰형 (사실과 혜택을 차분하게 전달)" },
  { id: 5, label: "성공사례 강조형 (수료생 변화·취업 성공 스토리 중심)" },
  { id: 6, label: "감성·스토리텔링형 (감정에 공감하며 이야기로 풀어가는 말투)" },
  { id: 7, label: "간결·임팩트형 (짧고 강렬하게 핵심만 전달)" },
];

export const CHANNELS: ChannelOption[] = [
  { id: 1, label: "문자/카카오톡", description: "90자 이내 간결 요약형" },
  { id: 2, label: "전화 안내", description: "구어체·공감형 안내 스크립트" },
  { id: 3, label: "Facebook", description: "공감형 스토리텔링" },
  { id: 4, label: "Instagram", description: "짧고 임팩트 있는 문구 + 이모지" },
  { id: 5, label: "Blog", description: "상세 설명형 + 해시태그 자동 생성" },
  { id: 6, label: "전단지", description: "굵은 헤드라인 + 혜택 목록형" },
  { id: 7, label: "현수막·배너", description: "초단문 강조형" },
];
