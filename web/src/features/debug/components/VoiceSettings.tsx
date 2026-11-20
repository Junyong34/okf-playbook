// 말투 설정 켜기·끄기. 가이드 문서는 번들마다 지정한다 (config/bundles.ts).
import { Switch } from '@astryxdesign/core/Switch';
import type { VoiceGuide } from '@okf/request.ts';
import { formatChars } from '@/shared/utils/format.ts';
import { SettingsGroup } from './SettingsGroup.tsx';

type VoiceSettingsProps = {
  guide: VoiceGuide | null;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function VoiceSettings({ guide, enabled, onChange }: VoiceSettingsProps) {
  return (
    <SettingsGroup title="말투 설정" description="가이드 문서를 지시문 뒤에 붙입니다. 근거로는 쓰지 않습니다.">
      <Switch
        label={guide ? guide.path : '이 번들에는 말투 설정이 없습니다'}
        description={guide ? `${formatChars(guide.text.trim().length)} · 끄면 지시문만 보냅니다` : undefined}
        value={guide !== null && enabled}
        isDisabled={guide === null}
        onChange={onChange}
        labelPosition="start"
        labelSpacing="spread"
        width="100%"
        size="sm"
      />
    </SettingsGroup>
  );
}
