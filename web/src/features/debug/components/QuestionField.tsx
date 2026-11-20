// 질문 입력과 예시 질문. Cmd/Ctrl+Enter로 실행한다.
import type { KeyboardEvent } from 'react';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Token } from '@astryxdesign/core/Token';

type QuestionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  samples: readonly string[];
  onSubmit: () => void;
};

export function QuestionField({ value, onChange, samples, onSubmit }: QuestionFieldProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  };
  return (
    <VStack gap={2}>
      <div onKeyDown={onKeyDown}>
        <TextArea
          label="질문"
          description="고객 문의를 그대로 넣으세요. ⌘/Ctrl + Enter로 실행합니다."
          value={value}
          onChange={(next) => onChange(next)}
          rows={4}
          placeholder="예: 받은 지 5일 된 할인 상품 반품돼요? 배송도 늦어서 불편했어요."
        />
      </div>
      {samples.length > 0 && (
        <HStack gap={1} wrap="wrap">
          {samples.map((sample, i) => (
            <Token key={sample} size="sm" label={`예시 ${i + 1}`} description={sample} onClick={() => onChange(sample)} />
          ))}
        </HStack>
      )}
    </VStack>
  );
}
