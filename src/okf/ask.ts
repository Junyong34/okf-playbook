// 질문 하나를 끝까지 처리하는 질의응답 모듈.
// 검색 단계 → 고른 개념마다 신뢰 등급·주의 → 프롬프트. CLI(retrieve·prompt·check-answer)와 웹 화면이 같은 결과를 쓴다.
// 주의를 모델에게도 넘길지는 0008 실습 5단계에서 정한다. 지금 프롬프트는 0005 그대로이고, 주의는 picks[].assessment에만 있다.
import type { Bundle } from './types.ts';
import { isConceptPath, readConcepts, resolvePathField } from './concept.ts';
import { retrieve, type Options, type Pick } from './retrieve.ts';
import { assess, type Assessment } from './trust.ts';
import { buildPrompt } from './answer.ts';

// 고른 개념 + 신뢰·수명 판정. 주의가 있어도 빼지 않는다 (§5.3, §11.2).
// replacement: deprecated 개념의 superseded_by를 번들 경로로 푼 결과 (§5.4, §6.2). 대체 개념을 검색 결과에 더하지는 않는다.
//  target: 번들 루트 기준 경로(번들 밖이면 null), concept: 그 경로가 번들의 개념인지
export type Replacement = { raw: string; target: string | null; concept: boolean };
export type AssessedPick = Pick & { assessment: Assessment; replacement?: Replacement };

export type Asked = {
  question: string;
  options: Options;
  now: Date;
  picks: AssessedPick[];
  warnings: string[];
  prompt: string;
};

export function ask(bundle: Bundle, question: string, options: Options, now: Date): Asked {
  const { picks, warnings } = retrieve(bundle, question, options);
  const frontmatter = new Map(readConcepts(bundle).map((c) => [c.path, c.frontmatter]));
  const assessed = picks.map((p): AssessedPick => {
    const assessment = assess(frontmatter.get(p.path) ?? {}, now);
    if (assessment.supersededBy === undefined) return { ...p, assessment };
    const { target } = resolvePathField(bundle, p.path, assessment.supersededBy);
    return { ...p, assessment, replacement: { raw: assessment.supersededBy, target, concept: target !== null && isConceptPath(bundle, target) } };
  });
  return { question, options, now, picks: assessed, warnings, prompt: buildPrompt(bundle, question, picks) };
}
