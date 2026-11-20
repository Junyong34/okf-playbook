// 상담원 답변 한 개. 고객에게 보이는 화면이라 내부 정보(고른 개념, 인용 검사)는 보여 주지 않는다.
import { Avatar } from '@astryxdesign/core/Avatar';
import { ChatMessage, ChatMessageBubble, ChatSystemMessage } from '@astryxdesign/core/Chat';
import { useAnnounce, useClipboard } from '@astryxdesign/core/hooks';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { CheckIcon, Square2StackIcon } from '@heroicons/react/24/outline';
import * as stylex from '@stylexjs/stylex';
import { normalizeCitations } from '@/features/qa/citations.ts';
import { AnswerMarkdown } from '@/features/qa/components/AnswerMarkdown.tsx';
import { GenerationErrorBanner } from '@/features/qa/components/GenerationErrorBanner.tsx';
import { RefusalBanner } from '@/features/qa/components/RefusalBanner.tsx';
import { NO_PICKS_ANSWER } from '@/features/qa/labels.ts';
import type { ChatTurn } from '@/features/chat/history.ts';

export const ASSISTANT_NAME = '상담원';

const answerTime = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });

const styles = stylex.create({
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    marginBlockStart: '0.375rem',
    minHeight: '1.75rem',
    color: 'var(--color-text-secondary)',
  },
  copy: {
    width: '1.75rem',
    height: '1.75rem',
    minWidth: '1.75rem',
    paddingInline: 0,
    color: 'inherit',
  },
  time: {
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
});

type AssistantTurnProps = {
  run: ChatTurn;
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
  const answerProps = {
    text: run.text,
    providedPaths: run.providedPaths,
    hideUnknownCitations: true,
  };
  switch (run.phase) {
    case 'skipped':
      return <AnswerMarkdown text={NO_PICKS_ANSWER} providedPaths={[]} isStreaming={false} />;
    case 'error':
      return <GenerationErrorBanner error={run.error!} onRetry={onRetry} />;
    case 'streaming':
      return run.text === '' ? <Thinking /> : <AnswerMarkdown {...answerProps} isStreaming />;
    case 'done':
      if (run.refusal) return <RefusalBanner refusal={run.refusal} />;
      return <AnswerMarkdown {...answerProps} isStreaming={false} />;
    case 'stopped':
    case 'assembled':
      return run.text ? <AnswerMarkdown {...answerProps} isStreaming={false} /> : null;
  }
}

function AnswerFooter({ at, text }: { at: number; text: string }) {
  const announce = useAnnounce();
  const { copy, isCopied } = useClipboard({ announce: '답변을 복사했습니다.' });
  const label = isCopied ? '복사 완료' : '답변 복사';

  async function copyAnswer() {
    const copied = await copy(normalizeCitations(text, { keepOnly: [] }).trim());
    if (!copied) announce('답변을 복사하지 못했습니다.', 'assertive');
  }

  return (
    <div {...stylex.props(styles.footer)}>
      {text.trim() && (
        <IconButton
          label={label}
          tooltip={label}
          variant="ghost"
          size="sm"
          xstyle={styles.copy}
          icon={<Icon icon={isCopied ? CheckIcon : Square2StackIcon} size="sm" />}
          onClick={() => void copyAnswer()}
        />
      )}
      <time {...stylex.props(styles.time)} dateTime={new Date(at).toISOString()}>{answerTime.format(at)}</time>
    </div>
  );
}

export function AssistantTurn({ run, onRetry }: AssistantTurnProps) {
  const at = run.finishedAt ?? run.startedAt;
  const footer = run.phase !== 'streaming' && run.phase !== 'assembled';
  const copyText = run.phase === 'skipped' ? NO_PICKS_ANSWER
    : run.phase === 'stopped' || (run.phase === 'done' && !run.refusal) ? run.text
    : '';
  return (
    <>
      <ChatMessage sender="assistant" name={ASSISTANT_NAME} avatar={<Avatar name={ASSISTANT_NAME} size="md" />}>
        <ChatMessageBubble
          variant="ghost"
          width="100%"
          metadata={footer ? <AnswerFooter at={at} text={copyText} /> : undefined}>
          <AnswerBody run={run} onRetry={onRetry} />
        </ChatMessageBubble>
      </ChatMessage>
      {run.phase === 'stopped' && <ChatSystemMessage>답변을 중단했습니다</ChatSystemMessage>}
    </>
  );
}
