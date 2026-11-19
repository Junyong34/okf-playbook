// 화면에 보여 줄 한국어 이름. OKF 값(신뢰 등급·주의·검색 방식)과 실행 상태를 사람 말로 바꾼다.
import type { Caution, Tier } from '@okf/trust.ts';
import type { Pick } from '@okf/retrieve.ts';
import type { StopReason } from '@claude/types.ts';
import type { RunPhase } from './types.ts';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';
type DotVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

export const TIER_LABEL: Record<Tier, { label: string; variant: BadgeVariant }> = {
  'human-reviewed': { label: '사람 검토', variant: 'success' },
  'machine-confirmed': { label: '기계 확인', variant: 'info' },
  unverified: { label: '미검토', variant: 'neutral' },
};

export const CAUTION_LABEL: Record<Caution, string> = {
  draft: '초안',
  deprecated: '폐기됨',
  'unknown-status': '알 수 없는 상태',
  stale: '낡음',
  'bad-date': '날짜 오류',
  'bad-verified': '검토 기록 오류',
};

export const VIA_LABEL: Record<Pick['via'], string> = {
  keyword: '키워드',
  link: '링크 확장',
};

export const PHASE_LABEL: Record<RunPhase, { label: string; dot: DotVariant }> = {
  streaming: { label: '생성 중', dot: 'accent' },
  done: { label: '완료', dot: 'success' },
  stopped: { label: '중단됨', dot: 'warning' },
  error: { label: '오류', dot: 'error' },
  assembled: { label: '조립만 함', dot: 'neutral' },
  skipped: { label: '모델 요청 생략', dot: 'warning' },
};

export const STOP_REASON_LABEL: Record<StopReason, string> = {
  end_turn: '정상 종료',
  max_tokens: '출력 상한 도달',
  stop_sequence: '중지 문자열',
  refusal: '거절',
  pause_turn: '일시 중지',
  other: '기타',
};

// 고른 개념이 없을 때 상담 화면에 보여 주는 답. NO_EVIDENCE("확인할 수 없")와 맞춘다.
export const NO_PICKS_ANSWER = '문의하신 내용은 현재 안내 자료에서 확인할 수 없습니다. 질문을 조금 더 구체적으로 남겨 주시면 다시 찾아보겠습니다.';
