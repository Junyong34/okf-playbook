// 생성 설정: 모델과 effort
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { EFFORTS, type Effort, type GenerationSettings, type ModelId } from '@claude/models.ts';
import { MODEL_SELECTOR_OPTIONS } from '@/config/models.ts';
import { SettingsGroup } from './SettingsGroup.tsx';

type GenerationSettingsFieldsProps = {
  value: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
};

export function GenerationSettingsFields({ value, onChange }: GenerationSettingsFieldsProps) {
  return (
    <SettingsGroup title="생성 설정" description="상담 화면에 쓸 모델을 고르기 위해 비교합니다.">
      <Selector
        label="모델"
        size="sm"
        width="100%"
        value={value.model}
        onChange={(model) => model && onChange({ model: model as ModelId })}
        options={MODEL_SELECTOR_OPTIONS}
      />
      <SegmentedControl
        label="effort"
        layout="fill"
        size="sm"
        value={value.effort}
        onChange={(effort) => onChange({ effort: effort as Effort })}>
        {EFFORTS.map((effort) => (
          <SegmentedControlItem key={effort} value={effort} label={effort} />
        ))}
      </SegmentedControl>
    </SettingsGroup>
  );
}
