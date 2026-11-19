// 고른 개념 하나: 제목·경로, 고른 이유(키워드 점수·겹친 키워드 / 링크 출발점), 신뢰 등급과 주의.
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import type { AssessedPick } from '@okf/ask.ts';
import { CAUTION_LABEL, TIER_LABEL, VIA_LABEL } from '@/features/qa/labels.ts';

const MAX_MATCHED_SHOWN = 16;

type PickCardProps = {
  order: number;
  pick: AssessedPick;
  title: string;
  bodyChars?: string;
};

export function PickCard({ order, pick, title, bodyChars }: PickCardProps) {
  const tier = TIER_LABEL[pick.assessment.tier];
  const hidden = pick.matched.length - MAX_MATCHED_SHOWN;
  return (
    <Card variant="muted" padding={3}>
      <VStack gap={2}>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Text type="label" weight="semibold">
            {order}. {title}
          </Text>
          <Text type="code" color="secondary">
            {pick.path}
          </Text>
          <StackItem size="fill" />
          <Badge variant={pick.via === 'keyword' ? 'blue' : 'purple'} label={VIA_LABEL[pick.via]} />
          {pick.via === 'keyword' && <Badge variant="neutral" label={`점수 ${pick.score}`} />}
          <Badge variant={tier.variant} label={tier.label} />
          {pick.assessment.cautions.map((c) => (
            <Badge key={c} variant="warning" label={CAUTION_LABEL[c]} />
          ))}
        </HStack>

        {pick.via === 'link' && pick.from && (
          <Text type="supporting">
            <Text type="code">{pick.from}</Text>의 링크를 따라 들어왔습니다.
          </Text>
        )}
        {pick.via === 'keyword' && pick.matched.length > 0 && (
          <HStack gap={1} wrap="wrap" vAlign="center">
            <Text type="supporting">겹친 키워드</Text>
            {pick.matched.slice(0, MAX_MATCHED_SHOWN).map((m) => (
              <Token key={m} size="sm" label={m} />
            ))}
            {hidden > 0 && <Text type="supporting">외 {hidden}개</Text>}
          </HStack>
        )}
        {pick.replacement && (
          <Text type="supporting">
            대체 개념: <Text type="code">{pick.replacement.target ?? pick.replacement.raw}</Text>
            {pick.replacement.concept ? '' : ' (번들의 개념이 아님)'}
          </Text>
        )}
        {bodyChars && <Text type="supporting">모델에 넣은 본문 {bodyChars} · frontmatter 제외</Text>}
      </VStack>
    </Card>
  );
}
