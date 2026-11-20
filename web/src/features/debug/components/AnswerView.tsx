// "답변" 탭: 스트리밍 답변(인용 칩)과 원문, 종료 이유.
import { useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { AnswerMarkdown } from '@/features/qa/components/AnswerMarkdown.tsx';
import { GenerationErrorBanner } from '@/features/qa/components/GenerationErrorBanner.tsx';
import { RefusalBanner } from '@/features/qa/components/RefusalBanner.tsx';
import { NO_PICKS_ANSWER, STOP_REASON_LABEL } from '@/features/qa/labels.ts';
import type { QaRun } from '@/features/qa/runs.ts';
import { TextBlock } from '@/shared/ui/TextBlock.tsx';

type ViewMode = 'rendered' | 'raw';

type AnswerViewProps = { run: QaRun; onRetry: () => void };

export function AnswerView({ run, onRetry }: AnswerViewProps) {
  const [mode, setMode] = useState<ViewMode>('rendered');
  const providedPaths = run.prepared.assembled.record.providedPaths;

  if (run.phase === 'assembled') {
    return <EmptyState title="모델을 부르지 않았습니다" description="조립만 보기로 실행했습니다. 모델 호출로 다시 실행하세요." isCompact />;
  }
  if (run.phase === 'skipped') {
    return (
      <VStack gap={3}>
        <Banner status="warning" title="모델 요청 생략" description="상담 화면에는 아래 고정 답이 나갑니다." />
        <Card variant="muted" padding={4}>
          <Text>{NO_PICKS_ANSWER}</Text>
        </Card>
      </VStack>
    );
  }

  const isStreaming = run.phase === 'streaming';
  const stopReason = run.result?.stopReason;

  return (
    <VStack gap={3}>
      {run.phase === 'error' && run.error && <GenerationErrorBanner error={run.error} onRetry={onRetry} />}
      {run.result?.refusal && <RefusalBanner refusal={run.result.refusal} showDetails />}
      {stopReason === 'max_tokens' && <Banner status="warning" title="출력 상한에 닿아 답변이 잘렸습니다" />}
      {run.phase === 'stopped' && <Banner status="info" title="생성을 중단했습니다" description="받은 부분까지만 보여 줍니다." />}

      <HStack gap={3} vAlign="center">
        <StackItem size="fill">
          <HStack gap={2} vAlign="center">
            {isStreaming && <Spinner size="sm" label="생성 중" />}
            <Text type="supporting">
              {isStreaming ? '받는 중' : stopReason ? `종료 이유: ${STOP_REASON_LABEL[stopReason]}` : ''}
            </Text>
          </HStack>
        </StackItem>
        <SegmentedControl label="보기 방식" size="sm" value={mode} onChange={(v) => setMode(v as ViewMode)}>
          <SegmentedControlItem value="rendered" label="화면" />
          <SegmentedControlItem value="raw" label="원문" />
        </SegmentedControl>
      </HStack>

      {run.text === '' && isStreaming ? (
        <Text type="supporting">첫 글자를 기다리는 중입니다.</Text>
      ) : mode === 'rendered' ? (
        <Card padding={4}>
          <AnswerMarkdown text={run.text} providedPaths={providedPaths} isStreaming={isStreaming} density="default" />
        </Card>
      ) : (
        <TextBlock title="답변 원문" code={run.text} />
      )}
    </VStack>
  );
}
