// 생성 설정: 모델과 effort
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { EFFORT_OPTIONS, MODEL_OPTIONS, type Effort, type GenerationSettings, type ModelId } from '@/config/models.ts';
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
        options={MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label, description: `${m.id} · ${m.description}` }))}
      />
      <SegmentedControl
        label="effort"
        layout="fill"
        size="sm"
        value={value.effort}
        onChange={(effort) => onChange({ effort: effort as Effort })}>
        {EFFORT_OPTIONS.map((o) => (
          <SegmentedControlItem key={o.value} value={o.value} label={o.label} />
        ))}
      </SegmentedControl>
    </SettingsGroup>
  );
}
