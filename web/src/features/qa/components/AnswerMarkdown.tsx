// 답변 본문: 스트리밍을 부드럽게 보여 주고, 모델에 준 문서의 인용을 제목 칩으로 바꾼다.
import { useMemo } from 'react';
import { Markdown } from '@astryxdesign/core/Markdown';
import { useStreamingText } from '@astryxdesign/core/hooks';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import { citationSources, normalizeCitations } from '../citations.ts';

type AnswerMarkdownProps = {
  text: string;
  providedPaths: readonly string[];
  isStreaming: boolean;
  density?: 'default' | 'compact';
  hideUnknownCitations?: boolean; // 상담 화면: 모델에 주지 않은 문서의 인용 표시를 지운다
};

export function AnswerMarkdown({ text, providedPaths, isStreaming, density = 'compact', hideUnknownCitations = false }: AnswerMarkdownProps) {
  const { titleOf } = useBundles();
  const displayedText = useStreamingText(text, isStreaming);
  const sources = useMemo(() => citationSources(providedPaths, titleOf), [providedPaths, titleOf]);
  return (
    <Markdown density={density} isStreaming={isStreaming} sources={sources} citationStyle="label" contentWidth="100%">
      {normalizeCitations(displayedText, hideUnknownCitations ? { keepOnly: providedPaths } : {})}
    </Markdown>
  );
}
