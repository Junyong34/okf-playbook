import { Banner } from '@astryxdesign/core/Banner';
import type { Refusal } from '@claude/types.ts';

type RefusalBannerProps = {
  refusal: Refusal;
  showDetails?: boolean; // 디버깅 화면에서만 분류와 설명을 보여 준다
};

export function RefusalBanner({ refusal, showDetails = false }: RefusalBannerProps) {
  const details = [refusal.category && `분류: ${refusal.category}`, refusal.explanation].filter(Boolean).join(' · ');
  return (
    <Banner
      status="warning"
      title="이 문의에는 답변을 드리기 어렵습니다"
      description={showDetails && details ? details : '다른 표현으로 다시 문의해 주세요.'}
    />
  );
}
