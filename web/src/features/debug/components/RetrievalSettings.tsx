// 검색 설정: CLI의 --fields, --no-links, --max, --min, --boost-meta
import { HStack, StackItem } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Switch } from '@astryxdesign/core/Switch';
import type { Options as RetrievalOptions } from '@okf/retrieve.ts';
import { SettingsGroup } from './SettingsGroup.tsx';

type RetrievalSettingsProps = {
  value: RetrievalOptions;
  onChange: (patch: Partial<RetrievalOptions>) => void;
};

export function RetrievalSettings({ value, onChange }: RetrievalSettingsProps) {
  return (
    <SettingsGroup title="검색 설정" description="질문과 개념의 두 글자 묶음이 겹치는 수로 고릅니다.">
      <SegmentedControl
        label="검색 대상"
        layout="fill"
        size="sm"
        value={value.fields}
        onChange={(fields) => onChange({ fields: fields as RetrievalOptions['fields'] })}>
        <SegmentedControlItem value="body" label="본문만" />
        <SegmentedControlItem value="body+meta" label="본문 + 메타 필드" />
      </SegmentedControl>
      <Switch
        label="링크 확장"
        description="고른 개념의 링크를 한 단계 따라갑니다."
        value={value.followLinks}
        onChange={(followLinks) => onChange({ followLinks })}
        labelPosition="start"
        labelSpacing="spread"
        width="100%"
        size="sm"
      />
      <Switch
        label="제목·태그 가산"
        description="제목과 태그에서도 겹친 키워드를 한 번 더 셉니다. 본문 + 메타 필드일 때만 적용됩니다."
        value={value.boostMeta}
        onChange={(boostMeta) => onChange({ boostMeta })}
        labelPosition="start"
        labelSpacing="spread"
        width="100%"
        size="sm"
      />
      <HStack gap={3}>
        <StackItem size="fill">
          <NumberInput
            label="상한"
            labelTooltip="한 질문에 고를 수 있는 개념 수의 최댓값 (링크 확장 포함)"
            size="sm"
            value={value.maxDocs}
            min={1}
            max={10}
            isIntegerOnly
            hasNumberSteppers
            onChange={(maxDocs) => onChange({ maxDocs })}
          />
        </StackItem>
        <StackItem size="fill">
          <NumberInput
            label="기준"
            labelTooltip="개념을 고르는 데 필요한 최소 점수"
            size="sm"
            value={value.minScore}
            min={0}
            max={50}
            isIntegerOnly
            hasNumberSteppers
            onChange={(minScore) => onChange({ minScore })}
          />
        </StackItem>
      </HStack>
    </SettingsGroup>
  );
}
