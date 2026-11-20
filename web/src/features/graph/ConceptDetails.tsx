import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Markdown } from '@astryxdesign/core/Markdown';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { frontmatterData, readBundleFile, resolveLink } from '@okf/concept.ts';
import type { EdgeKind, Graph, GraphNode } from '@okf/graph.ts';
import type { Bundle } from '@okf/types.ts';
import { ConceptMetadata } from './ConceptMetadata.tsx';
import { EDGE_STYLES } from './graphLayout.ts';

type DetailTab = 'links' | 'body';

type ConceptDetailsProps = {
  concept: GraphNode;
  bundle: Bundle;
  graph: Graph;
  titles: ReadonlyMap<string, string>;
  conceptHref: (path: string | null) => string;
  focusOnOpen: boolean;
};

const OPEN_CONCEPT_STATE = { graphOrigin: 'inspector' };

export function ConceptDetails({ concept, bundle, graph, titles, conceptHref, focusOnOpen }: ConceptDetailsProps) {
  const { path, title, type } = concept;
  const file = readBundleFile(bundle, path);
  const frontmatter = file && frontmatterData(file);
  const body = file?.body ?? '';
  const outgoing = graph.edges.filter((edge) => edge.from === path);
  const incoming = graph.edges.filter((edge) => edge.to === path);
  const otherReferences = graph.dangling.filter((reference) => reference.from === path);
  const hasConnections = outgoing.length + incoming.length + otherReferences.length > 0;
  const [tab, setTab] = useState<DetailTab>('body');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();

  useEffect(function focusConceptHeading() {
    if (focusOnOpen) titleRef.current?.focus({ preventScroll: true });
  }, [focusOnOpen]);

  return (
    <section className="okf-graph-details" aria-label="개념 상세">
      <header className="okf-graph-detail-header">
        <Link
          className="okf-graph-back"
          to={conceptHref(null)}
          state={{ graphOrigin: 'list' }}
          preventScrollReset>
          <ArrowLeftIcon aria-hidden="true" />
          개념 목록
        </Link>
        <h2 ref={titleRef} tabIndex={-1}>{title || path}</h2>
        <div className="okf-graph-detail-meta">
          <span translate="no">{type}</span>
          <code translate="no">{path}</code>
        </div>
      </header>
      <TabList role="tablist" aria-label="개념 상세 보기" value={tab} onChange={(value) => setTab(value as DetailTab)} hasDivider>
        <Tab id="graph-body-tab" panelId="graph-body-panel" value="body" label="문서" />
        <Tab id="graph-links-tab" panelId="graph-links-panel" value="links" label="연결" />
      </TabList>
      <div className="okf-graph-detail-content" key={tab}>
        <div role="tabpanel" id="graph-links-panel" aria-labelledby="graph-links-tab" hidden={tab !== 'links'} tabIndex={0}>
          {tab === 'links' && (
            <>
              <ConceptLinks heading="나가는 간선" links={outgoing.map(({ to, kind }) => ({ path: to, kind }))} titles={titles} conceptHref={conceptHref} />
              <ConceptLinks heading="들어오는 간선" links={incoming.map(({ from, kind }) => ({ path: from, kind }))} titles={titles} conceptHref={conceptHref} />
              {otherReferences.length > 0 && (
                <section className="okf-graph-link-group">
                  <h3>개념 이외의 참조</h3>
                  <ul>
                    {otherReferences.map((reference) => (
                      <li className="okf-graph-resource" key={JSON.stringify([reference.to, reference.kind])}>
                        <code translate="no">{reference.to}</code>
                        <small>
                          {EDGE_STYLES[reference.kind].label} · {reference.reason === 'missing' ? '경로를 찾을 수 없음' : '번들에 있는 자료'}
                        </small>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!hasConnections && <p className="okf-graph-panel-note">이 개념에 연결된 간선이나 자료가 없습니다.</p>}
            </>
          )}
        </div>
        <div role="tabpanel" id="graph-body-panel" aria-labelledby="graph-body-tab" hidden={tab !== 'body'} tabIndex={0}>
          {tab === 'body' && (
            <>
              {frontmatter && <ConceptMetadata frontmatter={frontmatter} />}
              <section className="okf-graph-document-body">
                <h3>본문</h3>
                {body.trim() ? (
                  <Markdown
                    density="compact"
                    headingLevelStart={4}
                    onLinkClick={(href, event) => {
                      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return;
                      event.preventDefault();
                      if (href.startsWith('#')) {
                        document.getElementById(href.slice(1))?.scrollIntoView({ block: 'nearest' });
                        return;
                      }
                      const target = resolveLink(path, href.split('#')[0]);
                      if (target && titles.has(target)) {
                        void navigate(conceptHref(target), { preventScrollReset: true, state: OPEN_CONCEPT_STATE });
                      }
                    }}>
                    {body}
                  </Markdown>
                ) : <p className="okf-graph-panel-note">본문이 없습니다.</p>}
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

type ConceptLinksProps = {
  heading: string;
  links: { path: string; kind: EdgeKind }[];
  titles: ReadonlyMap<string, string>;
  conceptHref: (path: string) => string;
};

function ConceptLinks({ heading, links, titles, conceptHref }: ConceptLinksProps) {
  if (!links.length) return null;
  return (
    <section className="okf-graph-link-group">
      <h3>{heading}</h3>
      <ul>
        {links.map(({ path, kind }) => (
          <li key={JSON.stringify([path, kind])}>
            <Link className="okf-graph-row" to={conceptHref(path)} state={OPEN_CONCEPT_STATE} preventScrollReset>
              <span className="okf-graph-row-text">
                <strong>{titles.get(path) || path}</strong>
                <small><i aria-hidden="true" style={{ backgroundColor: EDGE_STYLES[kind].color }} />{EDGE_STYLES[kind].label}</small>
              </span>
              <ChevronRightIcon className="okf-graph-row-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
