// 화면 상단 머리글: 제목·설명과 오른쪽 동작 버튼.
import type { ReactNode } from 'react';
import { LayoutHeader } from '@astryxdesign/core/Layout';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, description, badges, actions }: PageHeaderProps) {
  return (
    <LayoutHeader hasDivider>
      <HStack gap={4} vAlign="center">
        <StackItem size="fill">
          <VStack gap={0.5}>
            <HStack gap={2} vAlign="center">
              <Heading level={1}>
                {title}
              </Heading>
              {badges}
            </HStack>
            {description && (
              <Text type="supporting" color="secondary">
                {description}
              </Text>
            )}
          </VStack>
        </StackItem>
        {actions && (
          <HStack gap={2} vAlign="center">
            {actions}
          </HStack>
        )}
      </HStack>
    </LayoutHeader>
  );
}
