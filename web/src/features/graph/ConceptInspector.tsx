import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router';
import { ChevronRightIcon, DocumentTextIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Graph, GraphNode } from '@okf/graph.ts';
import type { Bundle } from '@okf/types.ts';
import { ConceptDetails } from './ConceptDetails.tsx';

const formatCount = new Intl.NumberFormat('ko-KR');
const OPEN_CONCEPT_STATE = { graphOrigin: 'inspector' };

type ConceptInspectorProps = {
  graph: Graph;
  bundle: Bundle;
  titles: ReadonlyMap<string, string>;
  selected: GraphNode | undefined;
  conceptHref: (path: string | null) => string;
};

export function ConceptInspector({ graph, bundle, titles, selected, conceptHref }: ConceptInspectorProps) {
  const [query, setQuery] = useState('');
  const [browseKey, setBrowseKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const queryText = query.trim().toLocaleLowerCase();
  const isBrowsing = !selected || browseKey === location.key;
  const results = isBrowsing
    ? graph.nodes.filter(({ title, path }) => (title + ' ' + path).toLocaleLowerCase().includes(queryText))
    : [];

  useEffect(function focusSearchOnReturn() {
    if (location.state?.graphOrigin === 'list') searchRef.current?.focus({ preventScroll: true });
  }, [location.key, location.state]);

  function updateQuery(value: string) {
    setQuery(value);
    setBrowseKey(location.key);
  }

  function clearSearch() {
    updateQuery('');
    searchRef.current?.focus({ preventScroll: true });
  }

  return (
    <aside className="okf-graph-sidebar" aria-label="개념 탐색">
      <form className="okf-graph-search" role="search" aria-label="개념 검색" onSubmit={(event) => {
        event.preventDefault();
        if (!isBrowsing) setBrowseKey(location.key);
        else if (results[0]) {
          void navigate(conceptHref(results[0].path), { preventScrollReset: true, state: OPEN_CONCEPT_STATE });
        }
      }}>
        <label htmlFor="graph-concept-query">개념 검색</label>
        <div className="okf-graph-search-field">
          <MagnifyingGlassIcon className="okf-graph-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            id="graph-concept-query"
            name="concept-query"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="예: 반품 정책, returns.md…"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
              event.preventDefault();
              if (selected && isBrowsing) setBrowseKey(null);
              else if (query) clearSearch();
            }}
          />
          {query && (
            <button type="button" aria-label="검색어 지우기" onClick={clearSearch}>
              <XMarkIcon aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
      {isBrowsing ? (
        <>
          <div className="okf-graph-list-header">
            <h2>{queryText ? '검색 결과' : '개념 목록'}</h2>
            <p role="status">{formatCount.format(results.length)}개</p>
          </div>
          {results.length > 0 ? (
            <ul className="okf-graph-results" aria-label="개념 목록">
              {results.map(({ path, title }) => (
                <li key={path}>
                  <Link
                    className="okf-graph-row"
                    to={conceptHref(path)}
                    state={OPEN_CONCEPT_STATE}
                    aria-label={title ? `${title} · ${path}` : path}
                    aria-current={path === selected?.path ? 'location' : undefined}
                    preventScrollReset>
                    <DocumentTextIcon className="okf-graph-row-icon" aria-hidden="true" />
                    <span className="okf-graph-row-text">
                      <strong>{title || path}</strong>
                      {title && <code translate="no">{path}</code>}
                    </span>
                    <ChevronRightIcon className="okf-graph-row-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="okf-graph-inspector-empty">
              <MagnifyingGlassIcon aria-hidden="true" />
              <p>{queryText ? '일치하는 개념이 없습니다.' : '이 번들에 개념이 없습니다.'}</p>
              {queryText && <button type="button" onClick={clearSearch}>모든 개념 보기</button>}
            </div>
          )}
        </>
      ) : selected && (
        <ConceptDetails
          key={selected.path}
          concept={selected}
          bundle={bundle}
          graph={graph}
          titles={titles}
          conceptHref={conceptHref}
          focusOnOpen={navigationType === 'PUSH' && location.state?.graphOrigin === 'inspector'}
        />
      )}
    </aside>
  );
}
