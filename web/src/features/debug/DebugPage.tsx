// 디버깅 화면 (/debug): 질문 하나를 처리하는 단계를 모두 펼쳐 본다.
// 왼쪽 열은 입력(질문·검색 설정·말투 설정·모델·effort), 오른쪽 열은 결과(요약 + 탭 네 개).
import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import type { QaInput } from '@/features/qa/runs.ts';
import { useQaSessions } from '@/features/qa/sessions.ts';
import { useQaRuns } from '@/features/qa/useQaRuns.ts';
import { useClaudeStatus } from '@/lib/claude/status.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { DebugControls } from './components/DebugControls.tsx';
import { DebugResults, type ResultTab } from './components/DebugResults.tsx';
import { useDebugForm } from './useDebugForm.ts';

const CONTROLS_WIDTH = 380;

export function DebugPage() {
  const { current } = useBundles();
  const formApi = useDebugForm();
  // 번들마다 실행 목록이 따로 있다. 번들을 바꾸면 그 번들의 마지막 결과가 보인다(메모리에만 둔다).
  const { latest, isRunning, start, stop } = useQaRuns(useQaSessions().debug.get(current.id));
  const [tab, setTab] = useState<ResultTab>('record');
  const { keyReady, message } = useClaudeStatus();

  const run = (dryRun: boolean) => {
    const question = formApi.form.question.trim();
    if (!question) return;
    const input: QaInput = {
      bundleId: current.id,
      question,
      retrieval: formApi.form.retrieval,
      voiceEnabled: formApi.form.voiceEnabled,
      generation: formApi.form.generation,
    };
    start(current, input, { dryRun });
    setTab(dryRun ? 'record' : 'answer');
  };

  const retry = () => {
    if (latest) start(current, latest.input);
  };

  return (
    <Layout
      height="fill"
      header={
        <PageHeader
          title="디버깅"
          description="질문 → 검색 단계 → 고른 개념 → 말투 설정 → 생성 단계 → 인용 검사"
          badges={<Badge variant="neutral" label={current.root} />}
        />
      }
      start={
        <LayoutPanel width={CONTROLS_WIDTH} hasDivider padding={4} label="입력">
          <DebugControls
            bundle={current}
            formApi={formApi}
            keyReady={keyReady}
            unavailableMessage={message}
            isRunning={isRunning}
            onRun={() => run(false)}
            onAssemble={() => run(true)}
            onStop={stop}
          />
        </LayoutPanel>
      }
      content={
        <LayoutContent padding={5} label="결과">
          <DebugResults run={latest} tab={tab} onTabChange={setTab} onRetry={retry} />
        </LayoutContent>
      }
    />
  );
}
