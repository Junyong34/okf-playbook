import type { EdgeKind, GraphNode } from '@okf/graph.ts';
import type { Bundle } from '@okf/types.ts';

export const LAYOUTS = {
  grid: '격자',
  circle: '원형',
  type: '문서 유형별',
} as const;

export type NodeLayout = keyof typeof LAYOUTS;
export type EdgeShape = 'auto' | 'line' | 'curved';

export const EDGE_STYLES: Record<EdgeKind, { label: string; color: string }> = {
  link: { label: '본문 링크', color: '#526a97' },
  source: { label: '출처', color: '#00857c' },
  'superseded-by': { label: '대체 개념', color: '#a65c24' },
  resource: { label: '자료', color: '#7254ab' },
  computation: { label: '계산', color: '#a03d68' },
  executor: { label: '실행기', color: '#4b7727' },
  attester: { label: '검증기', color: '#90631d' },
};

const NODE_COLORS = new Map([
  ['Policy', '#4d6dde'],
  ['Process', '#8a56b9'],
  ['Reference', '#00857c'],
  ['FAQ', '#527697'],
]);

const FAQ_CATEGORY_COLORS = [
  '#d47c1d', '#c74b64', '#748d32', '#9255bd', '#367ac8', '#18897d', '#a36037',
];

type CategoryStyle = { label: string; color: string };
export type FaqCategoryStyles = ReadonlyMap<string, CategoryStyle>;

function faqCategory(node: GraphNode): string | undefined {
  return node.type === 'FAQ' ? /^faqs\/([^/]+)\/.+/.exec(node.path)?.[1] : undefined;
}

export function faqCategoryStyles(nodes: readonly GraphNode[], bundle: Bundle): FaqCategoryStyles {
  const categories = new Set<string>();
  for (const node of nodes) {
    const category = faqCategory(node);
    if (category) categories.add(category);
  }

  return new Map([...categories].sort().map((category, index) => {
    const heading = bundle.get(`faqs/${category}/index.md`)?.match(/^#\s+(.+)$/m)?.[1].trim();
    const color = FAQ_CATEGORY_COLORS[index % FAQ_CATEGORY_COLORS.length];
    return [category, { label: heading || category, color }];
  }));
}

export function conceptPositions(nodes: readonly GraphNode[], layout: NodeLayout) {
  if (layout === 'circle') {
    const radius = Math.max(1, nodes.length / (2 * Math.PI));
    return nodes.map((node, index) => {
      const angle = Math.PI / 2 - (index / nodes.length) * 2 * Math.PI;
      return { ...node, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
  }

  if (layout === 'type') {
    // 같은 유형의 노드는 한 구역에 모으고, 큰 유형은 여러 줄로 나눈다.
    const groups = new Map<string, GraphNode[]>();
    for (const node of nodes) {
      const group = groups.get(node.type);
      if (group) group.push(node);
      else groups.set(node.type, [node]);
    }
    const columns = Math.ceil(Math.sqrt(nodes.length));
    let row = 0;
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([, group]) => {
      const startRow = row;
      row += Math.ceil(group.length / columns) + 1;
      return group.map((node, index) => ({ ...node, x: index % columns, y: -(startRow + Math.floor(index / columns)) }));
    });
  }

  const columns = Math.ceil(Math.sqrt(nodes.length));
  return nodes.map((node, index) => ({ ...node, x: index % columns, y: -Math.floor(index / columns) }));
}

export function nodeColor(node: GraphNode, categoryStyles: FaqCategoryStyles): string {
  const category = faqCategory(node);
  const categoryStyle = category ? categoryStyles.get(category) : undefined;
  return categoryStyle?.color ?? NODE_COLORS.get(node.type) ?? '#687a91';
}
