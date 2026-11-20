// 디버깅 화면 오른쪽 열: 요약 한 줄 + 탭 네 개.
import { Badge } from '@astryxdesign/core/Badge';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { BeakerIcon } from '@heroicons/react/24/outline';
import type { QaRun } from '@/features/qa/runs.ts';
import { AnswerView } from './AnswerView.tsx';
import { CitationCheckView } from './CitationCheckView.tsx';
import { ModelRequestView } from './ModelRequestView.tsx';
import { AssemblyRecordView } from './record/AssemblyRecordView.tsx';
import { RunSummary } from './RunSummary.tsx';

export type ResultTab = 'record' | 'request' | 'answer' | 'check';

type DebugResultsProps = {
  run: QaRun | null;
  tab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  onRetry: () => void;
};

function checkBadge(run: QaRun) {
  if (!run.check) return undefined;
  if (run.check.unknownCitations.length > 0) return <Badge variant="error" label={String(run.check.unknownCitations.length)} />;
  if (run.check.uncitedSentences.length > 0) return <Badge variant="neutral" label={String(run.check.uncitedSentences.length)} />;
  return <Badge variant="success" label="OK" />;
}

export function DebugResults({ run, tab, onTabChange, onRetry }: DebugResultsProps) {
  if (!run) {
    return (
      <VStack height="100%" hAlign="center" vAlign="center">
        <EmptyState
          icon={<Icon icon={BeakerIcon} size="lg" color="secondary" />}
          title="질문을 실행해 보세요"
          description="왼쪽에서 질문과 설정을 정하고 '조립만 보기'나 '모델 호출'을 누르면 처리 과정이 여기에 나옵니다."
        />
      </VStack>
    );
  }
  return (
    <VStack gap={4}>
      <RunSummary run={run} />
      <TabList value={tab} onChange={(v) => onTabChange(v as ResultTab)} hasDivider>
        <Tab value="record" label="요청 조립 기록" />
        <Tab value="request" label="모델 요청" />
        <Tab value="answer" label="답변" endContent={run.phase === 'streaming' ? <Badge variant="info" label="생성 중" /> : undefined} />
        <Tab value="check" label="인용 검사" endContent={checkBadge(run)} />
      </TabList>
      {tab === 'record' && <AssemblyRecordView run={run} />}
      {tab === 'request' && <ModelRequestView run={run} />}
      {tab === 'answer' && <AnswerView run={run} onRetry={onRetry} />}
      {tab === 'check' && <CitationCheckView run={run} />}
    </VStack>
  );
}
