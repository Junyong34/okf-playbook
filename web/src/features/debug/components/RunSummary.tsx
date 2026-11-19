// 결과 맨 위 한 줄: 상태 · 모델 · 고른 개념 수 · 토큰 · 소요 시간
import { useEffect, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/Layout';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { modelLabel } from '@/config/models.ts';
import { PHASE_LABEL } from '@/features/qa/labels.ts';
import type { QaRun } from '@/features/qa/types.ts';
import { formatDuration, formatNumber } from '@/shared/utils/format.ts';

// 생성 중에는 경과 시간을 0.1초마다 갱신한다.
function useElapsed(run: QaRun): number {
  const [now, setNow] = useState(() => Date.now());
  const running = run.finishedAt === null;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [running]);
  return (run.finishedAt ?? now) - run.startedAt;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <HStack gap={1} vAlign="center">
      <Text type="supporting">{label}</Text>
      <Text type="label" hasTabularNumbers>
        {value}
      </Text>
    </HStack>
  );
}

export function RunSummary({ run }: { run: QaRun }) {
  const phase = PHASE_LABEL[run.phase];
  const elapsed = useElapsed(run);
  const usage = run.result?.usage;
  const requested = run.input.generation.model;
  const served = run.result?.servedModel;

  return (
    <HStack gap={4} vAlign="center" wrap="wrap">
      <HStack gap={2} vAlign="center">
        <StatusDot variant={phase.dot} label={phase.label} />
        <Text type="label" weight="semibold">
          {phase.label}
        </Text>
      </HStack>
      <Item label="모델" value={`${modelLabel(requested)} · ${run.input.generation.effort}`} />
      {run.result?.fallbackUsed && served && (
        <Tooltip content={`거절되어 ${served}가 이어서 답했습니다.`}>
          <Badge variant="warning" label={`fallback: ${modelLabel(served)}`} />
        </Tooltip>
      )}
      <Item label="고른 개념" value={`${run.prepared.asked.picks.length}개`} />
      {usage && (
        <>
          <Item label="입력" value={formatNumber(usage.input)} />
          <Item label="출력" value={formatNumber(usage.output)} />
          {usage.cacheRead + usage.cacheWrite > 0 && (
            <Item label="캐시 읽기/쓰기" value={`${formatNumber(usage.cacheRead)} / ${formatNumber(usage.cacheWrite)}`} />
          )}
        </>
      )}
      {run.phase !== 'assembled' && run.phase !== 'skipped' && <Item label="소요" value={formatDuration(elapsed)} />}
    </HStack>
  );
}
