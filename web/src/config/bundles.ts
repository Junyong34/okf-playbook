// 화면에서 고를 수 있는 번들 목록. 자동 탐색하지 않고 여기에 직접 적는다.
// 스펙: .scratch/okf-web-ui/spec.md "번들과 말투 설정"
//
// 번들을 추가하는 방법 (예: martFAQ/)
//  1. 아래처럼 import.meta.glob 두 줄을 더한다. glob 패턴은 문자열 리터럴이어야 한다 (Vite 규칙).
//  2. BUNDLE_SOURCES에 항목을 더한다. root는 저장소 루트 기준 디렉터리 이름이다.
import type { VoiceGuide } from '@okf/request.ts';
import vocAnswerGuide from '../../../docs/voc-answer-guide.md?raw';

export type BundleSource = {
  id: string;           // URL ?bundle= 값
  label: string;        // 화면에 보이는 이름
  description: string;
  root: string;         // 저장소 루트 기준 번들 디렉터리
  documents: Record<string, string>; // glob 키 → .md 내용
  assetKeys: string[];               // glob 키 (.md가 아닌 파일, 내용은 읽지 않는다)
  voice: VoiceGuide | null;          // 말투 설정
  sampleQuestions: string[];         // 빈 화면에서 보여 줄 예시 질문
};

const VOC_ANSWER_GUIDE: VoiceGuide = { path: 'docs/voc-answer-guide.md', text: vocAnswerGuide };

const knowledgeDocuments = import.meta.glob<string>('../../../knowledge/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const knowledgeAssets = Object.keys(import.meta.glob(['../../../knowledge/**/*', '!../../../knowledge/**/*.md']));

export const BUNDLE_SOURCES: readonly BundleSource[] = [
  {
    id: 'knowledge',
    label: '반품·환불',
    description: '반품 정책, 반품 예외, 환불 절차',
    root: 'knowledge',
    documents: knowledgeDocuments,
    assetKeys: knowledgeAssets,
    voice: VOC_ANSWER_GUIDE,
    sampleQuestions: [
      '물건을 받은 지 5일 됐어요. 반품 신청할 수 있나요?',
      '할인 상품인데 주문할 때 최종 판매로 표시됐어요. 반품되나요?',
      '반품이 승인됐는데 언제 환불되나요?',
    ],
  },
];

export const DEFAULT_BUNDLE_ID = BUNDLE_SOURCES[0].id;
