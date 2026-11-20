// "모델 요청" 탭: SDK에 넘기는 파라미터, system·user 원문, JSON 내려받기.
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { modelLabel } from '@/config/models.ts';
import type { QaRun } from '@/features/qa/runs.ts';
import { downloadJson, timestampForFile } from '@/shared/utils/download.ts';
import { formatNumber } from '@/shared/utils/format.ts';
import { TextBlock } from '@/shared/ui/TextBlock.tsx';

// 내려받는 파일: 입력 설정 + API 파라미터 + 요청 조립 기록 + (있으면) 결과·인용 검사
function exportOf(run: QaRun) {
  return {
    exportedAt: new Date().toISOString(),
    input: run.input,
    apiRequest: run.prepared.apiRequest,
    assemblyRecord: run.prepared.assembled.record,
    retrieval: { picks: run.prepared.asked.picks, warnings: run.prepared.asked.warnings },
    result: run.result,
    citationCheck: run.check,
    phase: run.phase,
  };
}

export function ModelRequestView({ run }: { run: QaRun }) {
  const api = run.prepared.apiRequest;
  if (!api) {
    return <EmptyState title="모델 요청이 없습니다" description="고른 개념이 없어 모델을 부르지 않았습니다." isCompact />;
  }
  const user = api.messages[0].content;
  const download = () => downloadJson(`okf-run-${run.input.bundleId}-${timestampForFile(run.startedAt)}.json`, exportOf(run));

  return (
    <VStack gap={4}>
      <HStack gap={3} vAlign="start">
        <StackItem size="fill">
          <MetadataList columns="multi">
            <MetadataListItem label="model">{`${api.model} (${modelLabel(api.model)})`}</MetadataListItem>
            <MetadataListItem label="effort">{api.output_config.effort}</MetadataListItem>
            <MetadataListItem label="max_tokens">{formatNumber(api.max_tokens)}</MetadataListItem>
            <MetadataListItem label="fallbacks">{api.fallbacks ? `${api.fallbacks} · ${api.betas?.join(', ')}` : '없음 (Haiku 5.5)'}</MetadataListItem>
            <MetadataListItem label="thinking">생략 (adaptive)</MetadataListItem>
          </MetadataList>
        </StackItem>
        <Button label="JSON 내려받기" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} onClick={download} />
      </HStack>
      <TextBlock title={`system · ${formatNumber(api.system.length)}자`} code={api.system} />
      <TextBlock title={`messages[0] · user · ${formatNumber(user.length)}자`} code={user} />
    </VStack>
  );
}
