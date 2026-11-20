// 프롬프트·답변 원문용 코드 블록: 긴 줄은 줄바꿈하고, 길면 세로로 스크롤한다.
import { CodeBlock } from '@astryxdesign/core/CodeBlock';

type TextBlockProps = {
  title: string;
  code: string;
  language?: 'markdown' | 'json' | 'plaintext';
  maxHeight?: number;
};

export function TextBlock({ title, code, language = 'markdown', maxHeight = 440 }: TextBlockProps) {
  return (
    <CodeBlock
      title={title}
      code={code || ' '}
      language={language}
      hasLanguageLabel={false}
      isWrapped
      width="100%"
      maxHeight={maxHeight}
      size="sm"
      isCollapsible
      collapsibleThreshold={12}
    />
  );
}
