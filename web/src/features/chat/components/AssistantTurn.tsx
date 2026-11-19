// 상담원 답변 한 개. 고객에게 보이는 화면이라 내부 정보(고른 개념, 인용 검사)는 보여 주지 않는다.
import { Avatar } from '@astryxdesign/core/Avatar';
import { ChatMessage, ChatMessageBubble, ChatMessageMetadata, ChatSystemMessage } from '@astryxdesign/core/Chat';
import { HStack } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { AnswerMarkdown } from '@/features/qa/components/AnswerMarkdown.tsx';
import { GenerationErrorBanner } from '@/features/qa/components/GenerationErrorBanner.tsx';
import { RefusalBanner } from '@/features/qa/components/RefusalBanner.tsx';
import { NO_PICKS_ANSWER } from '@/features/qa/labels.ts';
import type { QaRun } from '@/features/qa/runs.ts';

export const ASSISTANT_NAME = '상담원';

type AssistantTurnProps = {
  run: QaRun;
  onRetry: () => void;
};

function Thinking() {
  return (
    <HStack gap={2} vAlign="center">
      <Spinner size="sm" label="답변 준비 중" />
      <Text type="supporting" color="secondary">
        안내 자료를 확인하고 있습니다
      </Text>
    </HStack>
  );
}

function AnswerBody({ run, onRetry }: AssistantTurnProps) {
  const providedPaths = run.prepared.assembled.record.providedPaths;
  switch (run.phase) {
    case 'skipped':
      return <AnswerMarkdown text={NO_PICKS_ANSWER} providedPaths={[]} isStreaming={false} />;
    case 'error':
      return <GenerationErrorBanner error={run.error!} onRetry={onRetry} />;
    case 'streaming':
      return run.text === '' ? <Thinking /> : <AnswerMarkdown text={run.text} providedPaths={providedPaths} isStreaming hideUnknownCitations />;
    case 'done':
      if (run.result?.refusal) return <RefusalBanner refusal={run.result.refusal} />;
      return <AnswerMarkdown text={run.text} providedPaths={providedPaths} isStreaming={false} hideUnknownCitations />;
    case 'stopped':
    case 'assembled':
      return run.text ? <AnswerMarkdown text={run.text} providedPaths={providedPaths} isStreaming={false} hideUnknownCitations /> : null;
  }
}

export function AssistantTurn({ run, onRetry }: AssistantTurnProps) {
  const at = run.finishedAt ?? run.startedAt;
  return (
    <>
      <ChatMessage sender="assistant" name={ASSISTANT_NAME} avatar={<Avatar name={ASSISTANT_NAME} size="md" />}>
        <ChatMessageBubble
          variant="ghost"
          width="100%"
          metadata={run.phase === 'streaming' ? undefined : <ChatMessageMetadata timestamp={<Timestamp value={at} format="time" />} />}>
          <AnswerBody run={run} onRetry={onRetry} />
        </ChatMessageBubble>
      </ChatMessage>
      {run.phase === 'stopped' && <ChatSystemMessage>답변을 중단했습니다</ChatSystemMessage>}
    </>
  );
}
