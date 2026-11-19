// 번들 자동 탐색 설정. bundles/<이름>/ 디렉터리를 만들면 웹 화면에 자동으로 나온다.
// 스펙: .scratch/okf-web-ui/spec.md "번들과 말투 설정"
//  - 번들 = bundles/ 바로 아래 디렉터리 하나. 그 index.md에 okf_version이 있어야 번들로 친다 (§8.1).
//  - 화면 이름·설명은 index.md의 title·description에서 읽는다.
//  - index.md에 없는 정보(예시 질문, 말투 설정)만 아래 BUNDLE_SETTINGS에 적는다. 적지 않은 번들은 기본값을 쓴다.
import type { VoiceGuide } from '@okf/request.ts';
import vocAnswerGuide from '../../../docs/voc-answer-guide.md?raw';

// 저장소 루트 기준 번들 모음 디렉터리
export const BUNDLES_DIR = 'bundles';

// glob 패턴은 문자열 리터럴이어야 한다 (Vite 규칙). .md는 내용을, 그 밖(asset)은 경로만 읽는다.
export const BUNDLE_DOCUMENTS: Record<string, string> = import.meta.glob<string>('../../../bundles/*/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
export const BUNDLE_ASSET_KEYS: string[] = Object.keys(
  import.meta.glob(['../../../bundles/*/**/*', '!../../../bundles/*/**/*.md']),
);

export type BundleSettings = {
  sampleQuestions?: string[]; // 빈 화면과 디버깅 화면의 예시 질문
  voice?: VoiceGuide | null;  // 말투 설정. null이면 말투 설정 없이 지시문만 보낸다
};

export const DEFAULT_VOICE: VoiceGuide = { path: 'docs/voc-answer-guide.md', text: vocAnswerGuide };

// 키는 bundles/ 아래 디렉터리 이름. 여기 적은 순서대로 선택기에 먼저 나오고, 나머지는 이름순이다.
export const BUNDLE_SETTINGS: Record<string, BundleSettings> = {
  knowledge: {
    sampleQuestions: [
      '물건을 받은 지 5일 됐어요. 반품 신청할 수 있나요?',
      '할인 상품인데 주문할 때 최종 판매로 표시됐어요. 반품되나요?',
      '반품이 승인됐는데 언제 환불되나요?',
    ],
  },
  sample_mart_faq: {
    sampleQuestions: [
      '교환이나 반품이 안 되는 경우가 있나요?',
      '오늘 적립한 포인트를 오늘 바로 쓸 수 있나요?',
      '쿠폰을 쓰고 결제를 취소했는데 환불 금액이 달라요.',
    ],
  },
};
