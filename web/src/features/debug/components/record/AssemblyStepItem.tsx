// 요청 조립 기록의 단계 하나: 번호 · 제목 · 요약(접혀도 보임) + 펼친 내용.
import type { ReactNode } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';

type AssemblyStepItemProps = {
  index: number;
  title: string;
  summary?: ReactNode;
  children: ReactNode;
};

export function AssemblyStepItem({ index, title, summary, children }: AssemblyStepItemProps) {
  return (
    <Collapsible
      value={`step-${index}`}
      trigger={
        <HStack gap={3} vAlign="center" width="100%">
          <Badge variant="neutral" label={String(index)} />
          <Text type="label" weight="semibold">
            {title}
          </Text>
          <StackItem size="fill">
            <Text type="supporting" maxLines={1}>
              {summary}
            </Text>
          </StackItem>
        </HStack>
      }>
      <VStack gap={3} paddingBlock={2}>
        {children}
      </VStack>
    </Collapsible>
  );
}
