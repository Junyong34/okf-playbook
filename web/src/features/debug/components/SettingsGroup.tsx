// 설정 패널의 묶음 하나: 제목 + 설명 + 컨트롤들.
import type { ReactNode } from 'react';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';

type SettingsGroupProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsGroup({ title, description, children }: SettingsGroupProps) {
  return (
    <VStack gap={3}>
      <VStack gap={0.5}>
        <Text type="label" weight="semibold">
          {title}
        </Text>
        {description && <Text type="supporting">{description}</Text>}
      </VStack>
      {children}
    </VStack>
  );
}
