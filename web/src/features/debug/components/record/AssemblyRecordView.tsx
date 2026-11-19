// "요청 조립 기록" 탭: 질문 → 검색 단계 → 문서 넣기 → 지시문 → 말투 설정 → 오늘 날짜 → 모델 요청 크기
import { Banner } from '@astryxdesign/core/Banner';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { VStack } from '@astryxdesign/core/Layout';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import type { AssemblyStep } from '@okf/request.ts';
import { VIA_LABEL } from '@/features/qa/labels.ts';
import type { QaRun } from '@/features/qa/runs.ts';
import { formatChars } from '@/shared/utils/format.ts';
import { AssemblyStepItem } from './AssemblyStepItem.tsx';
import { PickCard } from './PickCard.tsx';
import { TextBlock } from '@/shared/ui/TextBlock.tsx';

type StepOf<K extends AssemblyStep['kind']> = Extract<AssemblyStep, { kind: K }>;

function findStep<K extends AssemblyStep['kind']>(steps: readonly AssemblyStep[], kind: K): StepOf<K> | undefined {
  return steps.find((s): s is StepOf<K> => s.kind === kind);
}

export function AssemblyRecordView({ run }: { run: QaRun }) {
  const { asked, assembled } = run.prepared;
  const { record } = assembled;
  const documents = findStep(record.steps, 'documents')?.documents ?? [];
  const instruction = findStep(record.steps, 'instruction');
  const voice = findStep(record.steps, 'voice');
  const today = findStep(record.steps, 'today');
  const request = findStep(record.steps, 'request');
  const skipped = findStep(record.steps, 'skipped');
  const titleOf = new Map(documents.map((d) => [d.path, d]));
  const viaCounts = asked.picks.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.via]: (acc[p.via] ?? 0) + 1 }), {});
  const pickSummary = asked.picks.length
    ? Object.entries(viaCounts)
        .map(([via, n]) => `${VIA_LABEL[via as keyof typeof VIA_LABEL]} ${n}`)
        .join(' · ')
    : '기준을 넘은 개념이 없음';
  const opts = asked.options;
  let step = 0;

  return (
    <VStack gap={3}>
      {skipped && (
        <Banner
          status="warning"
          title="고른 개념이 없어 모델 요청을 생략했습니다"
          description="상담 화면에는 '확인할 수 없습니다' 답이 나갑니다. 기준을 낮추거나 검색 대상을 넓혀 보세요."
        />
      )}
      <CollapsibleGroup type="multiple" defaultValue={['step-1', 'step-2', 'step-3']} hasDividers>
        <AssemblyStepItem index={++step} title="질문" summary={record.question}>
          <Text>{record.question}</Text>
        </AssemblyStepItem>

        <AssemblyStepItem index={++step} title="검색 단계" summary={`${asked.picks.length}개 고름 · ${pickSummary}`}>
          <Text type="supporting">
            검색 대상 {opts.fields === 'body' ? '본문만' : '본문 + 메타 필드'} · 링크 확장 {opts.followLinks ? '켬' : '끔'} · 상한{' '}
            {opts.maxDocs} · 기준 {opts.minScore}
          </Text>
          {asked.warnings.length > 0 && (
            <Banner status="info" title={`경고 ${asked.warnings.length}건`} description={asked.warnings.join(' / ')} />
          )}
          {asked.picks.map((pick, i) => (
            <PickCard
              key={pick.path}
              order={i + 1}
              pick={pick}
              title={titleOf.get(pick.path)?.title ?? pick.path}
              bodyChars={titleOf.has(pick.path) ? formatChars(titleOf.get(pick.path)!.bodyChars) : undefined}
            />
          ))}
        </AssemblyStepItem>

        {!skipped && (
          <>
            <AssemblyStepItem
              index={++step}
              title="문서 넣기"
              summary={`${documents.length}개 · ${formatChars(documents.reduce((n, d) => n + d.bodyChars, 0))}`}>
              <Text type="supporting">고른 순서대로 본문만 &lt;document path&gt; 블록에 넣습니다. frontmatter는 검색에만 씁니다.</Text>
              <MetadataList>
                {documents.map((d) => (
                  <MetadataListItem key={d.path} label={d.path}>{`${d.title} · ${formatChars(d.bodyChars)}`}</MetadataListItem>
                ))}
              </MetadataList>
            </AssemblyStepItem>

            {instruction && (
              <AssemblyStepItem index={++step} title="지시문" summary={formatChars(instruction.text.length)}>
                <TextBlock title="system · 지시문" code={instruction.text} />
              </AssemblyStepItem>
            )}

            {voice && (
              <AssemblyStepItem
                index={++step}
                title="말투 설정"
                summary={voice.guide ? `${voice.guide.path} · ${formatChars(voice.guide.chars)}` : '꺼짐'}>
                <Text type="supporting">
                  {voice.guide
                    ? `${voice.guide.path} 본문을 <voice_guide>로 지시문 뒤에 붙였습니다. 지시문과 부딪히면 지시문을 따릅니다.`
                    : '말투 설정을 끄고 지시문만 보냈습니다.'}
                </Text>
              </AssemblyStepItem>
            )}

            {today && (
              <AssemblyStepItem index={++step} title="오늘 날짜" summary={`${today.date} (${today.timeZone})`}>
                <Text type="supporting">
                  계절 인사에만 씁니다. 질문이 바뀌어도 system이 같도록 user 메시지 맨 앞 &lt;today&gt;에 넣었습니다.
                </Text>
              </AssemblyStepItem>
            )}

            {request && (
              <AssemblyStepItem
                index={++step}
                title="모델 요청"
                summary={`system ${formatChars(request.systemChars)} · user ${formatChars(request.userChars)}`}>
                <Text type="supporting">원문은 "모델 요청" 탭에서 봅니다.</Text>
              </AssemblyStepItem>
            )}
          </>
        )}
      </CollapsibleGroup>
    </VStack>
  );
}
