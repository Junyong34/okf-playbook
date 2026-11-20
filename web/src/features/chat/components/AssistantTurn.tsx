// 상담원 답변 한 개. 고객에게 보이는 화면이라 내부 정보(고른 개념, 인용 검사)는 보여 주지 않는다.
import { useLayoutEffect, useRef } from 'react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ChatMessage, ChatMessageBubble, ChatMessageMetadata, ChatSystemMessage } from '@astryxdesign/core/Chat';
import { Citation, type CitationProps } from '@astryxdesign/core/Citation';
import { HStack } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { Tooltip } from '@astryxdesign/core/Tooltip';
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

function ChatCitation({ source, number, variant }: Pick<CitationProps, 'source' | 'number' | 'variant'>) {
  const anchorRef = useRef<HTMLElement>(null);
  const title = source.title ?? String(number);
  useLayoutEffect(function removeNativeTooltip() {
    // Citation은 기본 title을 붙인다. 같은 제목의 브라우저 툴팁이 겹치지 않게 한다.
    anchorRef.current?.removeAttribute('title');
  }, [title]);

  return (
    <>
      <Citation ref={anchorRef} source={source} number={number} variant={variant} tabIndex={0} />
      <Tooltip anchorRef={anchorRef} content={title} />
    </>
  );
}

const CHAT_MARKDOWN_COMPONENTS = { citation: ChatCitation };

function AnswerBody({ run, onRetry }: AssistantTurnProps) {
  const answerProps = {
    text: run.text,
    providedPaths: run.prepared.assembled.record.providedPaths,
    hideUnknownCitations: true,
    components: CHAT_MARKDOWN_COMPONENTS,
  };
  switch (run.phase) {
    case 'skipped':
      return <AnswerMarkdown text={NO_PICKS_ANSWER} providedPaths={[]} isStreaming={false} />;
    case 'error':
      return <GenerationErrorBanner error={run.error!} onRetry={onRetry} />;
    case 'streaming':
      return run.text === '' ? <Thinking /> : <AnswerMarkdown {...answerProps} isStreaming />;
    case 'done':
      if (run.result?.refusal) return <RefusalBanner refusal={run.result.refusal} />;
      return <AnswerMarkdown {...answerProps} isStreaming={false} />;
    case 'stopped':
    case 'assembled':
      return run.text ? <AnswerMarkdown {...answerProps} isStreaming={false} /> : null;
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
