import { useEffect, useRef, useState } from 'react';
import { MultiDirectedGraph } from 'graphology';
import type Sigma from 'sigma';
import type { EdgeKind, Graph } from '@okf/graph.ts';
import { conceptPositions, EDGE_STYLES, nodeColor, type EdgeShape, type FaqCategoryStyles, type NodeLayout } from './graphLayout.ts';

export type NodeSelection = { path: string; center: boolean };

type GraphCanvasProps = {
  graph: Graph;
  categoryStyles: FaqCategoryStyles;
  layout: NodeLayout;
  edgeKind: 'all' | EdgeKind;
  edgeShape: EdgeShape;
  selection: NodeSelection | null;
  onSelect: (path: string | null) => void;
};

function fitGraph(renderer: Sigma) {
  renderer.setSetting('autoRescale', true);
  renderer.refresh();
  renderer.setSetting('autoRescale', 'once');
  renderer.getCamera().setState({ x: 0.5, y: 0.5, angle: 0, ratio: 1 });
}

export function GraphCanvas({ graph, categoryStyles, layout, edgeKind, edgeShape, selection, onSelect }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<Sigma | null>(null);
  const highlightedPath = useRef<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(function mountGraphRenderer() {
    const container = containerRef.current;
    if (!container || graph.nodes.length === 0) return;

    const network = new MultiDirectedGraph();
    for (const node of conceptPositions(graph.nodes, layout)) {
      network.addNode(node.path, {
        x: node.x,
        y: node.y,
        label: node.title || node.path,
        color: nodeColor(node, categoryStyles),
        size: graph.nodes.length > 80 ? 4 : 10,
      });
    }
    for (const edge of graph.edges) {
      network.addDirectedEdgeWithKey(JSON.stringify([edge.from, edge.to, edge.kind]), edge.from, edge.to, {
        color: EDGE_STYLES[edge.kind].color,
        size: edge.kind === 'source' ? 2 : 1.5,
        kind: edge.kind,
        path: 'line',
        parallelPath: 'curved',
      });
    }

    let disposed = false;
    let instance: Sigma | undefined;

    async function startRenderer(target: HTMLDivElement) {
      // Sigma accesses WebGL2 globals during import, so check support first.
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      if (!context) {
        setUnavailable(true);
        return;
      }
      context.getExtension('WEBGL_lose_context')?.loseContext();

      const [{ default: Renderer, DEFAULT_STYLES }, { extremityArrow, pathCurved, pathLine }] = await Promise.all([
        import('sigma'),
        import('sigma/rendering'),
      ]);
      if (disposed) return;

      const color = getComputedStyle(target).getPropertyValue('--color-text-primary').trim();
      instance = new Renderer(network, target, {
        settings: {
          autoRescale: 'once',
          enableNodeDrag: true,
          itemSizesReference: 'screen',
          nodePickingPadding: 3,
          stagePadding: 56,
        },
        primitives: {
          edges: { paths: [pathLine(), pathCurved()], extremities: [extremityArrow()] },
        },
        styles: {
          nodes: [
            { ...DEFAULT_STYLES.nodes, labelColor: color || '#25314a', labelSize: 13, labelPosition: 'below', backdropVisibility: 'hidden', cursor: 'grab' },
            { whenState: 'isHighlighted', then: { size: 14, labelVisibility: 'visible', labelSize: 15, depth: 'topNodes' } },
          ],
          edges: {
            ...DEFAULT_STYLES.edges,
            head: 'arrow',
            path: { attribute: 'path' },
            parallelPath: { attribute: 'parallelPath' },
            parallelSpread: 0.32,
          },
        },
      });
      instance.on('clickNode', ({ node }) => onSelect(node));
      instance.on('clickStage', () => {
        if (highlightedPath.current) onSelect(null);
      });
      setRenderer(instance);
    }

    startRenderer(container).catch((error: unknown) => {
      if (disposed) return;
      console.warn('그래프 렌더러를 시작하지 못했습니다.', error);
      container.replaceChildren();
      setUnavailable(true);
    });

    return () => {
      disposed = true;
      instance?.kill();
      highlightedPath.current = null;
    };
  }, [graph, categoryStyles, layout, onSelect]);

  useEffect(function updateEdges() {
    if (!renderer) return;

    const network = renderer.getGraph();
    network.updateEachEdgeAttributes((_key, attributes) => ({
      ...attributes,
      path: edgeShape === 'curved' ? 'curved' : 'line',
      parallelPath: edgeShape === 'line' ? 'line' : 'curved',
    }), { attributes: ['path', 'parallelPath'] });
    const visible: string[] = [];
    const hidden: string[] = [];
    network.forEachEdge((key, { kind }) => (edgeKind === 'all' || edgeKind === kind ? visible : hidden).push(key));
    renderer.setEdgesState(visible, { isHidden: false });
    renderer.setEdgesState(hidden, { isHidden: true });
  }, [edgeKind, edgeShape, renderer]);

  useEffect(function highlightSelection() {
    if (!renderer) return;
    if (highlightedPath.current) renderer.setNodeState(highlightedPath.current, { isHighlighted: false });
    highlightedPath.current = selection?.path ?? null;
    if (!selection) return;

    renderer.setNodeState(selection.path, { isHighlighted: true });
    if (selection.center) {
      const position = renderer.getNodeDisplayData(selection.path);
      if (position) {
        const point = renderer.framedGraphToViewport(position);
        const { width, height } = renderer.getDimensions();
        const isVisible = point.x >= 36 && point.x <= width - 36 && point.y >= 36 && point.y <= height - 36;
        const isOverview = graph.nodes.length <= 80;
        if (isOverview && isVisible) return;
        const camera = renderer.getCamera();
        const ratio = isOverview ? camera.ratio : Math.min(camera.ratio, 0.7);
        camera.setState({ x: position.x, y: position.y, ratio });
      }
    }
  }, [selection, renderer, graph.nodes.length]);

  return (
    <div className="okf-graph-stage">
      <div ref={containerRef} className="okf-graph-canvas" aria-label="OKF 개념 그래프" />
      {graph.nodes.length === 0 && <p className="okf-graph-stage-message">이 번들에 표시할 개념이 없습니다.</p>}
      {unavailable && <p className="okf-graph-stage-message">그래프를 그릴 수 없습니다. 개념 목록에서 문서를 열 수 있습니다.</p>}
      {renderer && categoryStyles.size > 0 && (
        <aside className="okf-graph-category-legend" aria-label="FAQ 카테고리 색상">
          <p>FAQ 카테고리</p>
          <ul>
            {[...categoryStyles].map(([category, { label, color }]) => (
              <li key={category}><i aria-hidden="true" style={{ backgroundColor: color }} />{label}</li>
            ))}
          </ul>
        </aside>
      )}
      {renderer && (
        <button
          type="button"
          className="okf-graph-fit"
          onClick={() => fitGraph(renderer)}>
          화면 맞춤
        </button>
      )}
    </div>
  );
}
