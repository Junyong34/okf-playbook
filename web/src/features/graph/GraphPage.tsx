import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { buildGraph, type EdgeKind } from '@okf/graph.ts';
import { useBundles } from '@/features/bundles/BundleContext.ts';
import type { LoadedBundle } from '@/lib/bundles/loadBundles.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { ConceptInspector } from './ConceptInspector.tsx';
import { GraphCanvas } from './GraphCanvas.tsx';
import { EDGE_STYLES, LAYOUTS, type EdgeShape, type NodeLayout } from './graphLayout.ts';
import './graph.css';

export function GraphPage() {
  const { current } = useBundles();
  return (
    <Layout
      height="fill"
      header={<PageHeader title="그래프" description={current.label} />}
      content={
        <LayoutContent label="그래프 탐색">
          <BundleGraph key={current.id} loaded={current} />
        </LayoutContent>
      }
    />
  );
}

function BundleGraph({ loaded }: { loaded: LoadedBundle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const graph = useMemo(() => buildGraph(loaded.bundle), [loaded.bundle]);
  const titles = useMemo(() => new Map(graph.nodes.map(({ path, title }) => [path, title])), [graph]);
  const edgeKinds = useMemo(() => [...new Set(graph.edges.map(({ kind }) => kind))], [graph]);
  const [layout, setLayout] = useState<NodeLayout>('grid');
  const [edgeKind, setEdgeKind] = useState<'all' | EdgeKind>('all');
  const [edgeShape, setEdgeShape] = useState<EdgeShape>('auto');
  const selectedPath = new URLSearchParams(location.hash.slice(1)).get('concept');
  const selected = graph.nodes.find(({ path }) => path === selectedPath);
  const origin = location.state?.graphOrigin;
  const selection = useMemo(
    () => selected ? { path: selected.path, center: origin !== 'canvas' } : null,
    [selected, origin],
  );
  const { pathname, search } = location;
  const conceptHref = useCallback((path: string | null) => {
    const hash = path === null ? '' : `#concept=${encodeURIComponent(path)}`;
    return pathname + search + hash;
  }, [pathname, search]);
  const selectFromCanvas = useCallback(function selectFromCanvas(path: string | null) {
    void navigate(conceptHref(path), { preventScrollReset: true, state: { graphOrigin: 'canvas' } });
  }, [navigate, conceptHref]);
  const visibleEdgeCount = graph.edges.filter(({ kind }) => edgeKind === 'all' || kind === edgeKind).length;

  return (
    <div className="okf-graph-workspace">
      <ConceptInspector
        graph={graph}
        bundle={loaded.bundle}
        titles={titles}
        selected={selected}
        conceptHref={conceptHref}
      />
      <section className="okf-graph-view" aria-label="그래프 보기">
        <div className="okf-graph-controls">
          <label>
            노드 배치
            <select value={layout} onChange={(event) => setLayout(event.target.value as NodeLayout)}>
              {Object.entries(LAYOUTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            간선 종류
            <select value={edgeKind} onChange={(event) => setEdgeKind(event.target.value as 'all' | EdgeKind)} disabled={!edgeKinds.length}>
              <option value="all">모든 종류</option>
              {edgeKinds.map((kind) => <option key={kind} value={kind}>{EDGE_STYLES[kind].label}</option>)}
            </select>
          </label>
          <label>
            간선 모양
            <select value={edgeShape} onChange={(event) => setEdgeShape(event.target.value as EdgeShape)} disabled={!edgeKinds.length}>
              <option value="auto">자동</option>
              <option value="line">직선</option>
              <option value="curved">곡선</option>
            </select>
          </label>
        </div>
        <GraphCanvas
          key={layout}
          graph={graph}
          layout={layout}
          edgeKind={edgeKind}
          edgeShape={edgeShape}
          selection={selection}
          onSelect={selectFromCanvas}
        />
        <footer className="okf-graph-legend">
          <p>개념 {graph.nodes.length}개 · 간선 {visibleEdgeCount}개{graph.dangling.length > 0 && ` · 개념 이외 참조 ${graph.dangling.length}개`}</p>
          {edgeKinds.map((kind) => (edgeKind === 'all' || edgeKind === kind) && (
            <span key={kind}><i style={{ backgroundColor: EDGE_STYLES[kind].color }} />{EDGE_STYLES[kind].label}</span>
          ))}
        </footer>
      </section>
    </div>
  );
}
