import { UndirectedGraph } from 'graphology';
import forceAtlas2Import, { type ForceAtlas2Settings, type ForceAtlas2SynchronousLayoutParameters } from 'graphology-layout-forceatlas2';
import noverlapImport, { type NoverlapLayoutParameters } from 'graphology-layout-noverlap';
// 루트 테스트(node --test)도 이 파일을 불러오므로 @okf 별칭 대신 상대 경로를 쓴다.
import type { EdgeKind, Graph, GraphEdge, GraphNode } from '../../../../src/okf/graph.ts';
import type { Bundle } from '../../../../src/okf/types.ts';

// 두 레이아웃 패키지는 CommonJS라 루트(nodenext)와 웹(bundler)에서 default import 타입이 달라진다.
// 실행할 때는 양쪽 모두 함수 자체가 들어오므로 쓰는 부분만 타입을 붙인다.
const forceAtlas2 = forceAtlas2Import as unknown as {
  assign(graph: UndirectedGraph, params: ForceAtlas2SynchronousLayoutParameters): void;
  inferSettings(graph: UndirectedGraph): ForceAtlas2Settings;
};
const noverlap = noverlapImport as unknown as {
  assign(graph: UndirectedGraph, params: NoverlapLayoutParameters): void;
};

export const LAYOUTS = {
  force: '연결 구조',
  grid: '격자',
  circle: '원형',
  type: '문서 유형별',
} as const;

export type NodeLayout = keyof typeof LAYOUTS;
export type EdgeShape = 'auto' | 'line' | 'curved';

export const EDGE_STYLES: Record<EdgeKind, { label: string; color: string }> = {
  link: { label: '본문 링크', color: '#2f6fdf' },
  source: { label: '출처', color: '#e2541b' },
  'superseded-by': { label: '대체 개념', color: '#a65c24' },
  resource: { label: '자료', color: '#7254ab' },
  computation: { label: '계산', color: '#a03d68' },
  executor: { label: '실행기', color: '#4b7727' },
  attester: { label: '검증기', color: '#90631d' },
};

// 노드가 이보다 많으면 큰 그래프로 보고 노드를 작게, 보조 선을 숨겨 그린다.
export const LARGE_GRAPH = 80;

// 같은 두 개념 사이의 간선(방향·종류가 달라도)은 선 하나로 그린다.
// kinds는 색을 고를 우선순위 순서다. 가장 흔한 본문 링크는 맨 뒤로 보낸다.
export type DrawnEdge = {
  key: string;
  from: string;
  to: string;
  kinds: EdgeKind[];
  bidirectional: boolean;
  // 같은 유형끼리 잇는 선(FAQ↔FAQ, 주제↔주제). 큰 그래프에서는 선택했을 때만 보인다.
  secondary: boolean;
};

const KIND_PRIORITY = (Object.keys(EDGE_STYLES) as EdgeKind[]).sort((a, b) => Number(a === 'link') - Number(b === 'link'));

export function mergeEdges(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): DrawnEdge[] {
  const types = new Map(nodes.map(({ path, type }) => [path, type]));
  const merged = new Map<string, DrawnEdge>();
  for (const { from, to, kind } of edges) {
    const key = JSON.stringify(from < to ? [from, to] : [to, from]);
    const drawn = merged.get(key);
    if (!drawn) {
      merged.set(key, { key, from, to, kinds: [kind], bidirectional: false, secondary: types.get(from) === types.get(to) });
      continue;
    }
    if (drawn.from !== from) drawn.bidirectional = true;
    if (!drawn.kinds.includes(kind)) drawn.kinds.push(kind);
  }
  for (const drawn of merged.values()) drawn.kinds.sort((a, b) => KIND_PRIORITY.indexOf(a) - KIND_PRIORITY.indexOf(b));
  return [...merged.values()];
}

// 노드가 모일 무리. 주제(Topic)는 자기 자신이 무리의 중심이고, 다른 개념은 이어진 주제를 따른다.
// 주제가 없는 번들에서는 FAQ 카테고리, 그다음 문서 유형으로 묶는다.
function clusterOf(nodes: readonly GraphNode[], drawn: readonly DrawnEdge[]): Map<string, string> {
  const types = new Map(nodes.map(({ path, type }) => [path, type]));
  const topics = new Map<string, string[]>();
  for (const { from, to, secondary } of drawn) {
    if (secondary) continue;
    for (const [node, other] of [[from, to], [to, from]]) {
      if (types.get(other) !== 'Topic') continue;
      const list = topics.get(node);
      if (list) list.push(other);
      else topics.set(node, [other]);
    }
  }
  return new Map(nodes.map((node) => [
    node.path,
    node.type === 'Topic' ? node.path : topics.get(node.path)?.sort()[0] ?? faqCategory(node) ?? node.type,
  ]));
}

export function nodeSize(degree: number, nodeCount: number): number {
  return nodeCount > LARGE_GRAPH ? Math.min(12, 3 + Math.sqrt(degree)) : 10;
}

function degrees(drawn: readonly DrawnEdge[]): Map<string, number> {
  const degree = new Map<string, number>();
  for (const { from, to } of drawn) {
    degree.set(from, (degree.get(from) ?? 0) + 1);
    degree.set(to, (degree.get(to) ?? 0) + 1);
  }
  return degree;
}

// 무리마다 큰 원 위에 자리를 주고 그 둘레에 구성원을 놓은 뒤, ForceAtlas2로 연결을 따라 다듬는다.
// 시작 위치가 정해져 있어 같은 번들은 늘 같은 모양으로 그려진다.
function forcePositions(graph: Graph): Map<string, { x: number; y: number }> {
  const drawn = mergeEdges(graph.nodes, graph.edges);
  const clusters = clusterOf(graph.nodes, drawn);
  const members = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const cluster = clusters.get(node.path)!;
    if (node.path === cluster) continue;
    const list = members.get(cluster);
    if (list) list.push(node.path);
    else members.set(cluster, [node.path]);
  }
  const clusterKeys = [...new Set(clusters.values())].sort();
  const ring = Math.max(1, Math.sqrt(graph.nodes.length) * 2);
  const degree = degrees(drawn);

  const network = new UndirectedGraph();
  clusterKeys.forEach((cluster, index) => {
    const angle = (index / clusterKeys.length) * 2 * Math.PI;
    const cx = clusterKeys.length > 1 ? Math.cos(angle) * ring : 0;
    const cy = clusterKeys.length > 1 ? Math.sin(angle) * ring : 0;
    const size = (path: string) => nodeSize(degree.get(path) ?? 0, graph.nodes.length);
    if (clusters.get(cluster) === cluster) network.addNode(cluster, { x: cx, y: cy, size: size(cluster) });
    const list = members.get(cluster) ?? [];
    const radius = 0.5 + Math.sqrt(list.length) * 0.4;
    // 무리마다 시작 각도를 황금각만큼 돌려, 대칭인 시작 위치에서 노드가 한 줄에 갇히지 않게 한다.
    const offset = index * 2.39996;
    list.forEach((path, i) => {
      const a = offset + (i / list.length) * 2 * Math.PI;
      network.addNode(path, { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, size: size(path) });
    });
  });
  for (const { from, to, secondary } of drawn) network.addEdge(from, to, { weight: secondary ? 0.05 : 1 });

  forceAtlas2.assign(network, {
    iterations: 400,
    getEdgeWeight: 'weight',
    settings: {
      ...forceAtlas2.inferSettings(network),
      linLogMode: true,
      outboundAttractionDistribution: true,
      adjustSizes: false,
      barnesHutOptimize: false,
      gravity: 0.05,
      scalingRatio: 60,
      slowDown: 2,
    },
  });
  noverlap.assign(network, { maxIterations: 150, settings: { margin: 2, ratio: 1.2 } });

  const positions = new Map<string, { x: number; y: number }>();
  network.forEachNode((path, { x, y }) => positions.set(path, { x, y }));
  return positions;
}

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

export function conceptPositions(graph: Graph, layout: NodeLayout) {
  const { nodes } = graph;
  if (layout === 'force') {
    const positions = forcePositions(graph);
    return nodes.map((node) => ({ ...node, ...positions.get(node.path)! }));
  }

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
