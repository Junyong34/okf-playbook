// 6회차 실습: judge·compare 구현 완료 (tests/compare.test.ts). 순서: C1단계 judge → C2단계 compare.
// 레슨: learn/lessons/0006-compare-settings.html
import type { Bundle } from './types.ts';
import { retrieve, type Options, type Pick } from './retrieve.ts';

// ── 질문과 설정 (제공) ────────────────────────────────────────────────
// expected가 비어 있으면 번들에서 근거를 찾을 수 없어야 하는 질문이다.
export type Question = { id: string; text: string; expected: string[] };

// evaluation.md의 질문 6개. 실습 5단계에서 직접 만든 질문(q7, q8)을 뒤에 더한다.
export const QUESTIONS: Question[] = [
  { id: 'q1', text: '물건을 받은 지 5일 됐어요. 반품 신청할 수 있나요?', expected: ['policies/returns.md'] },
  { id: 'q2', text: '8일이 지난 할인 상품도 반품할 수 있나요?', expected: ['policies/returns.md'] },
  { id: 'q3', text: '할인 상품인데 주문할 때 최종 판매로 표시됐어요.', expected: ['policies/returns.md', 'policies/return-exceptions.md'] },
  { id: 'q4', text: '반품이 승인됐는데 언제 환불되나요?', expected: ['processes/refunds.md'] },
  {
    id: 'q5',
    text: '할인 상품을 반품할 수 있나요? 환불은 언제 들어오나요?',
    expected: ['policies/returns.md', 'policies/return-exceptions.md', 'processes/refunds.md'],
  },
  { id: 'q6', text: '해외 주문 반품 배송비는 누가 부담하나요?', expected: [] },
  // 실습 4단계 예시 (레슨 모범 답안). 기대 근거는 질문을 만들 때 먼저 정했다.
  { id: 'q7', text: '환불 기간이 얼마나 되나요?', expected: ['processes/refunds.md'] }, // "기간"은 description에만 있다
  {
    id: 'q8',
    text: '할인 상품 반품했는데 돈은 언제 돌려받나요?',
    expected: ['policies/returns.md', 'processes/refunds.md'], // 환불 절차는 링크로만 들어온다
  },
];

export type Setting = { name: string; options: Options };

// 학습 계획 6회차의 세 설정. 상한(maxDocs)과 기준(minScore)은 세 설정이 같아야 비교가 된다.
export function settings(maxDocs = 3, minScore = 2): Setting[] {
  return [
    { name: '본문', options: { fields: 'body', followLinks: false, maxDocs, minScore } },
    { name: '본문+분류', options: { fields: 'body+meta', followLinks: false, maxDocs, minScore } },
    { name: '본문+분류+링크', options: { fields: 'body+meta', followLinks: true, maxDocs, minScore } },
  ];
}

// ── 판정 ────────────────────────────────────────────────────────────
export type Judgement = {
  missing: string[];    // 기대 근거인데 고르지 못한 경로 (expected 순서)
  extra: string[];      // 골랐지만 기대 근거가 아닌 경로 (picks 순서)
  linkHelped: string[]; // 링크로 들어왔고 기대 근거인 경로. 링크 확장이 유효했던 사례 (picks 순서)
};

// C1단계: 고른 개념(picks)과 기대 근거(expected)를 비교한다.
export function judge(picks: Pick[], expected: string[]): Judgement {
  // C1단계 (완료)
  const got = new Set(picks.map((p) => p.path));
  const want = new Set(expected);
  return {
    missing: expected.filter((e) => !got.has(e)),
    extra: picks.filter((p) => !want.has(p.path)).map((p) => p.path),
    linkHelped: picks.filter((p) => p.via === 'link' && want.has(p.path)).map((p) => p.path),
  };
}

export type Row = Judgement & { question: Question; setting: string; picks: Pick[] };

// C2단계: 질문마다 모든 설정으로 retrieve를 돌리고 judge로 판정한다.
// 순서는 질문 순서가 바깥, 설정 순서가 안쪽이다 (q1·본문, q1·본문+분류, …, q2·본문, …).
export function compare(bundle: Bundle, questions: Question[], settingList: Setting[]): Row[] {
  // C2단계 (완료)
  return questions.flatMap((question) =>
    settingList.map((s) => {
      const { picks } = retrieve(bundle, question.text, s.options);
      return { question, setting: s.name, picks, ...judge(picks, question.expected) };
    }),
  );
}

// ── 표 만들기 (제공) ────────────────────────────────────────────────
const name = (path: string) => path.split('/').pop()!;
const list = (paths: string[], empty: string) => (paths.length ? paths.map(name).join(', ') : empty);
const pickLabel = (p: Pick) => `${name(p.path)}(${p.via === 'keyword' ? p.score : '링크'})`;

// evaluation.md에 붙여 넣을 Markdown 표. 파일 이름만 쓴다(지금 번들은 이름이 겹치지 않는다).
export function toMarkdown(rows: Row[]): string {
  const lines = [
    '| # | 설정 | 고른 개념 (점수 또는 링크) | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const r of rows) {
    const picked = r.picks.length ? r.picks.map(pickLabel).join(', ') : '(없음)';
    const missing = r.question.expected.length ? list(r.missing, '없음') : '해당 없음';
    lines.push(`| ${r.question.id} | ${r.setting} | ${picked} | ${missing} | ${list(r.extra, '없음')} | ${list(r.linkHelped, '')} |`);
  }
  return lines.join('\n');
}

// 설정별 합계: 빠진 근거 수, 불필요한 개념 수, 링크가 살린 근거 수.
export function summarize(rows: Row[]): string {
  const names = [...new Set(rows.map((r) => r.setting))];
  const lines = ['| 설정 | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |', '| --- | --- | --- | --- |'];
  for (const n of names) {
    const rs = rows.filter((r) => r.setting === n);
    const sum = (k: keyof Judgement) => rs.reduce((acc, r) => acc + r[k].length, 0);
    lines.push(`| ${n} | ${sum('missing')} | ${sum('extra')} | ${sum('linkHelped')} |`);
  }
  return lines.join('\n');
}
