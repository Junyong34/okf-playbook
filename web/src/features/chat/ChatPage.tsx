// 상담 화면 (/chat): 질문과 답변만 보인다. Astryx ai-chat 템플릿 구조(ChatLayout + ChatMessageList + ChatComposer).
// 질문 하나에 모델 요청 하나(단일 턴). 이전 대화는 화면에만 남고 모델에는 보내지 않는다.
import { Fragment, useEffect, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { ChatComposer, ChatLayout, ChatMessageList, ChatSystemMessage } from '@astryxdesign/core/Chat';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import * as stylex from '@stylexjs/stylex';
import { CHAT_GENERATION } from '@claude/models.ts';
import { DEFAULT_OPTIONS } from '@okf/retrieve.ts';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import { useQaRuns } from '@/features/qa/useQaRuns.ts';
import type { QaInput } from '@/features/qa/types.ts';
import { useClaudeStatus } from '@/lib/claude/status.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { AssistantTurn } from './components/AssistantTurn.tsx';
import { ChatWelcome } from './components/ChatWelcome.tsx';
import { UserTurn } from './components/UserTurn.tsx';

// ChatLayout은 flex: 1로 남은 높이를 채운다. 부모가 높이를 가진 세로 flex여야 입력창이 바닥에 붙는다.
const styles = stylex.create({
  chatFrame: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },
});

export function ChatPage() {
  const { current } = useBundles();
  const { runs, isRunning, start, stop, reset } = useQaRuns();
  const [draft, setDraft] = useState('');
  const { keyReady, message } = useClaudeStatus();

  // 번들이 바뀌면 이전 대화의 근거가 달라지므로 대화를 새로 시작한다.
  useEffect(() => reset(), [current.id, reset]);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || isRunning) return;
    const input: QaInput = {
      bundleId: current.id,
      question: text,
      retrieval: DEFAULT_OPTIONS,
      voiceEnabled: true,
      generation: CHAT_GENERATION,
    };
    start(current, input);
    setDraft('');
  };

  return (
    <Layout
      height="fill"
      header={
        <PageHeader
          title="상담"
          description={`${current.label} 안내 자료를 근거로 답변합니다.`}
          badges={<Badge variant="neutral" label={current.root} />}
          actions={
            <Button
              label="새 상담"
              variant="secondary"
              size="sm"
              icon={<Icon icon={ArrowPathIcon} size="sm" />}
              isDisabled={runs.length === 0}
              onClick={reset}
            />
          }
        />
      }
      content={
        <LayoutContent padding={0} isScrollable={false}>
          <div {...stylex.props(styles.chatFrame)}>
              <ChatLayout
                density="spacious"
                emptyState={
                  <ChatWelcome bundleLabel={current.label} questions={current.sampleQuestions} isDisabled={!keyReady} onPick={ask} />
                }
                composer={
                  <ChatComposer
                    value={draft}
                    onChange={setDraft}
                    onSubmit={ask}
                    onStop={stop}
                    isStopShown={isRunning}
                    isDisabled={!keyReady}
                    placeholder={keyReady ? '궁금한 점을 입력하세요' : 'API 키를 설정하면 질문할 수 있습니다'}
                    status={keyReady ? undefined : { type: 'warning', message }}
                    statusPosition="top"
                  />
                }>
                {runs.length > 0 && (
                  <ChatMessageList isStreaming={isRunning}>
                    <ChatSystemMessage variant="divider">오늘</ChatSystemMessage>
                    {runs.map((run) => (
                      <Fragment key={run.id}>
                        <UserTurn question={run.input.question} at={run.startedAt} />
                        <AssistantTurn run={run} onRetry={() => ask(run.input.question)} />
                      </Fragment>
                    ))}
                  </ChatMessageList>
                )}
              </ChatLayout>
          </div>
        </LayoutContent>
      }
    />
  );
}
