import { ChatMessage, ChatMessageBubble, ChatMessageMetadata } from '@astryxdesign/core/Chat';
import { Timestamp } from '@astryxdesign/core/Timestamp';

type UserTurnProps = { question: string; at: number };

export function UserTurn({ question, at }: UserTurnProps) {
  return (
    <ChatMessage sender="user">
      <ChatMessageBubble metadata={<ChatMessageMetadata timestamp={<Timestamp value={at} format="time" />} />}>
        {question}
      </ChatMessageBubble>
    </ChatMessage>
  );
}
