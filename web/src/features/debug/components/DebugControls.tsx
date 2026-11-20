// 디버깅 화면 왼쪽 열: 입력과 실행 버튼.
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { ArrowUturnLeftIcon, PlayIcon, StopIcon, WrenchIcon } from '@heroicons/react/24/outline';
import type { LoadedBundle } from '@/lib/bundles/loadBundles.ts';
import type { DebugFormApi } from '../useDebugForm.ts';
import { GenerationSettingsFields } from './GenerationSettingsFields.tsx';
import { QuestionField } from './QuestionField.tsx';
import { RetrievalSettings } from './RetrievalSettings.tsx';
import { VoiceSettings } from './VoiceSettings.tsx';

type DebugControlsProps = {
  bundle: LoadedBundle;
  formApi: DebugFormApi;
  keyReady: boolean;
  unavailableMessage: string;
  isRunning: boolean;
  onRun: () => void;
  onAssemble: () => void;
  onStop: () => void;
};

export function DebugControls({ bundle, formApi, keyReady, unavailableMessage, isRunning, onRun, onAssemble, onStop }: DebugControlsProps) {
  const { form, setQuestion, setRetrieval, setVoiceEnabled, setGeneration, resetSettings, isDefaultSettings } = formApi;
  const hasQuestion = form.question.trim() !== '';

  return (
    <VStack gap={5}>
      <QuestionField value={form.question} onChange={setQuestion} samples={bundle.sampleQuestions} onSubmit={keyReady ? onRun : onAssemble} />

      <HStack gap={2}>
        {isRunning ? (
          <StackItem size="fill">
            <Button label="중단" variant="secondary" width="100%" icon={<Icon icon={StopIcon} size="sm" />} onClick={onStop} />
          </StackItem>
        ) : (
          <>
            <StackItem size="fill">
              <Button
                label="모델 호출"
                variant="primary"
                width="100%"
                icon={<Icon icon={PlayIcon} size="sm" />}
                isDisabled={!hasQuestion || !keyReady}
                onClick={onRun}
              />
            </StackItem>
            <StackItem size="fill">
              <Button
                label="조립만 보기"
                variant="secondary"
                width="100%"
                icon={<Icon icon={WrenchIcon} size="sm" />}
                isDisabled={!hasQuestion}
                onClick={onAssemble}
              />
            </StackItem>
          </>
        )}
      </HStack>
      {!keyReady && (
        <Text type="supporting">
          {unavailableMessage} 지금은 조립만 볼 수 있습니다.
        </Text>
      )}

      <Divider />
      <RetrievalSettings value={form.retrieval} onChange={setRetrieval} />
      <Divider />
      <VoiceSettings guide={bundle.voice} enabled={form.voiceEnabled} onChange={setVoiceEnabled} />
      <Divider />
      <GenerationSettingsFields value={form.generation} onChange={setGeneration} />

      <Button
        label="설정 기본값으로"
        variant="ghost"
        size="sm"
        icon={<Icon icon={ArrowUturnLeftIcon} size="sm" />}
        isDisabled={isDefaultSettings}
        onClick={resetSettings}
      />
    </VStack>
  );
}
