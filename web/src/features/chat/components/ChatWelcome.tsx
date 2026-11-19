// 대화가 비어 있을 때: 인사와 예시 질문 카드.
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { ChatBubbleLeftRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type ChatWelcomeProps = {
  bundleLabel: string;
  questions: readonly string[];
  isDisabled: boolean;
  onPick: (question: string) => void;
};

export function ChatWelcome({ bundleLabel, questions, isDisabled, onPick }: ChatWelcomeProps) {
  return (
    <VStack gap={6} hAlign="center" width="100%">
      <EmptyState
        icon={<Icon icon={ChatBubbleLeftRightIcon} size="lg" color="secondary" />}
        title="무엇을 도와드릴까요?"
        description={`${bundleLabel} 안내 자료를 근거로 답변해 드립니다.`}
        headingLevel={2}
      />
      {questions.length > 0 && (
        <VStack gap={2} width="100%" maxWidth={560}>
          <Text type="supporting" color="secondary">
            자주 묻는 질문
          </Text>
          {questions.map((question) => (
            <ClickableCard
              key={question}
              label={question}
              variant="muted"
              padding={3}
              isDisabled={isDisabled}
              onClick={() => onPick(question)}>
              <HStack gap={3} vAlign="center" width="100%">
                <StackItem size="fill">
                  <Text>{question}</Text>
                </StackItem>
                <Icon icon={ChevronRightIcon} size="sm" color="secondary" />
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
