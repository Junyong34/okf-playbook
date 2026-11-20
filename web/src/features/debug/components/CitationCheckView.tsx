// "인용 검사" 탭. 스펙의 표시 규칙:
//  - 모델에 주지 않은 문서를 인용함(unknownCitations) → 경고
//  - 인용 없는 문장(uncitedSentences) → 경고가 아니라 "확인 필요" 목록 (사과·인사 문장도 여기에 들어간다)
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import type { QaRun } from '@/features/qa/runs.ts';
import { SettingsGroup } from './SettingsGroup.tsx';

export function CitationCheckView({ run }: { run: QaRun }) {
  const { titleOf } = useBundles();
  const check = run.check;
  const provided = run.prepared.assembled.record.providedPaths;

  if (!check) {
    const reason =
      run.phase === 'streaming'
        ? '답변이 끝나면 검사합니다.'
        : run.result?.refusal
          ? '거절된 답변은 검사하지 않습니다.'
          : '모델 답변이 있어야 검사할 수 있습니다.';
    return <EmptyState title="검사 결과가 없습니다" description={reason} isCompact />;
  }

  const unused = provided.filter((p) => !check.cited.includes(p));

  return (
    <VStack gap={5}>
      {check.unknownCitations.length > 0 ? (
        <Banner
          status="error"
          title={`모델에 주지 않은 문서를 인용했습니다 (${check.unknownCitations.length}건)`}
          description="지어낸 근거입니다. 답변을 그대로 내보내면 안 됩니다."
          collapsible={false}>
          <HStack gap={1} wrap="wrap">
            {check.unknownCitations.map((p) => (
              <Token key={p} label={p} color="red" />
            ))}
          </HStack>
        </Banner>
      ) : (
        <Banner status="success" title="인용한 문서는 모두 모델에 준 문서입니다" />
      )}
      {check.noEvidence && <Banner status="info" title="근거 없음 선언이 있습니다" description="답변이 번들에서 확인할 수 없다고 밝혔습니다." />}

      <SettingsGroup title={`인용한 문서 ${check.cited.length}개`}>
        <HStack gap={1} wrap="wrap">
          {check.cited.length === 0 && <Text type="supporting">없음</Text>}
          {check.cited.map((p) => (
            <Token key={p} label={titleOf(p) ?? p} description={p} color={provided.includes(p) ? 'green' : 'red'} />
          ))}
        </HStack>
        {unused.length > 0 && (
          <HStack gap={1} wrap="wrap" vAlign="center">
            <Text type="supporting">주었지만 인용하지 않음</Text>
            {unused.map((p) => (
              <Token key={p} size="sm" label={titleOf(p) ?? p} description={p} />
            ))}
          </HStack>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="인용 없음 (확인 필요)"
        description="정책·절차 주장인데 인용이 빠졌는지 사람이 확인합니다. 사과·인사 문장은 그대로 두면 됩니다.">
        {check.uncitedSentences.length === 0 ? (
          <Text type="supporting">없음</Text>
        ) : (
          <VStack gap={2}>
            {check.uncitedSentences.map((sentence, i) => (
              <Card key={`${i}-${sentence}`} variant="muted" padding={3}>
                <HStack gap={2} vAlign="start">
                  <Badge variant="neutral" label={String(i + 1)} />
                  <Text>{sentence}</Text>
                </HStack>
              </Card>
            ))}
          </VStack>
        )}
      </SettingsGroup>
    </VStack>
  );
}
