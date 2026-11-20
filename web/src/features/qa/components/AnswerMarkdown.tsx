// 답변 본문: 스트리밍을 부드럽게 보여 주고, 모델에 준 문서의 인용을 제목 칩으로 바꾼다.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Citation, type CitationProps } from '@astryxdesign/core/Citation';
import { Markdown } from '@astryxdesign/core/Markdown';
import { useStreamingText } from '@astryxdesign/core/hooks';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import { citationSources, normalizeCitations } from '../citations.ts';

type AnswerMarkdownProps = {
  text: string;
  providedPaths: readonly string[];
  isStreaming: boolean;
  density?: 'default' | 'compact';
  hideUnknownCitations?: boolean; // 상담 화면: 모델에 주지 않은 문서의 인용 표시를 지운다
};

function AnswerCitation({ source, number, variant }: Pick<CitationProps, 'source' | 'number' | 'variant'>) {
  const anchorRef = useRef<HTMLElement>(null);
  const title = source.title ?? String(number);
  useLayoutEffect(function removeNativeTooltip() {
    // Citation은 기본 title을 붙인다. 같은 제목의 브라우저 툴팁이 겹치지 않게 한다.
    anchorRef.current?.removeAttribute('title');
  }, [title]);

  return (
    <>
      <Citation ref={anchorRef} source={source} number={number} variant={variant} tabIndex={0} />
      <Tooltip anchorRef={anchorRef} content={title} />
    </>
  );
}

const ANSWER_MARKDOWN_COMPONENTS = { citation: AnswerCitation };

export function AnswerMarkdown({ text, providedPaths, isStreaming, density = 'compact', hideUnknownCitations = false }: AnswerMarkdownProps) {
  const { titleOf } = useBundles();
  const displayedText = useStreamingText(text, isStreaming);
  const sources = useMemo(() => citationSources(providedPaths, titleOf), [providedPaths, titleOf]);
  return (
    <Markdown density={density} isStreaming={isStreaming} sources={sources} citationStyle="label" contentWidth="100%" components={ANSWER_MARKDOWN_COMPONENTS}>
      {normalizeCitations(displayedText, hideUnknownCitations ? { keepOnly: providedPaths } : {})}
    </Markdown>
  );
}
