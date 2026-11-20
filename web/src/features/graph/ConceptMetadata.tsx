import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { asList, isBlank, parseTimestamp } from '@okf/concept.ts';

const SUMMARY_FIELDS = new Set(['title', 'type', 'description', 'status', 'tags']);
const FIELD_LABELS = new Map([
  ['generated', '생성 기록'],
  ['verified', '검토 기록'],
  ['stale_after', '재검토 기준일'],
  ['superseded_by', '대체 개념'],
  ['sources', '출처'],
  ['by', '작성·검토 주체'],
  ['at', '시각'],
  ['id', '식별자'],
  ['title', '제목'],
  ['description', '설명'],
  ['resource', '자료 경로'],
  ['author', '작성자'],
  ['last_modified', '마지막 수정'],
  ['usage_count', '사용 횟수'],
  ['usage_period', '집계 기간'],
]);

const STATUS_LABELS = new Map<string, { label: string; variant: BadgeVariant }>([
  ['stable', { label: '안정', variant: 'success' }],
  ['draft', { label: '초안', variant: 'neutral' }],
  ['deprecated', { label: '폐기됨', variant: 'warning' }],
]);

const DATE_FIELDS = new Set(['at', 'stale_after', 'last_modified']);
const dateOnly = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'UTC' });
const dateTime = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat('ko-KR');

export function ConceptMetadata({ frontmatter }: { frontmatter: Record<string, unknown> }) {
  const { description, status } = frontmatter;
  const tags = [...new Set(
    asList(frontmatter.tags)
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      .map((tag) => tag.trim()),
  )];
  const statusText = typeof status === 'string' ? status.trim() : '';
  const statusBadge = STATUS_LABELS.get(statusText);
  const hasDescription = typeof description === 'string' && description.trim() !== '';
  const fields = Object.entries(frontmatter).filter(([key, value]) => !SUMMARY_FIELDS.has(key) && !isBlank(value));

  if (!hasDescription && !tags.length && !statusText && !fields.length) return null;

  return (
    <section className="okf-graph-document-meta">
      <h3>문서 정보</h3>
      {hasDescription && <p className="okf-graph-document-description">{description}</p>}
      {(statusText || tags.length > 0) && (
        <dl className="okf-graph-meta-summary">
          {statusText && (
            <div>
              <dt>상태</dt>
              <dd><Badge variant={statusBadge?.variant ?? 'neutral'} label={statusBadge?.label ?? statusText} /></dd>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <dt>태그</dt>
              <dd>
                <ul className="okf-graph-meta-tags">
                  {tags.map((tag) => <li key={tag}><Badge className="okf-graph-tag" label={tag} /></li>)}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
      {fields.length > 0 && (
        <details className="okf-graph-meta-extra">
          <summary>추가 메타정보</summary>
          <MetadataFields fields={fields} ancestors={[frontmatter]} />
        </details>
      )}
    </section>
  );
}

function MetadataFields({ fields, ancestors }: { fields: [string, unknown][]; ancestors: readonly object[] }) {
  return (
    <dl className="okf-graph-meta-fields">
      {fields.map(([field, value]) => (
        <div key={field}>
          <dt>{FIELD_LABELS.get(field) ?? field}</dt>
          <dd><MetadataValue field={field} value={value} ancestors={ancestors} /></dd>
        </div>
      ))}
    </dl>
  );
}

function MetadataValue({ field, value, ancestors }: { field: string; value: unknown; ancestors: readonly object[] }) {
  if (isBlank(value)) return '값 없음';
  if (typeof value === 'string') {
    const timestamp = DATE_FIELDS.has(field) ? parseTimestamp(value) : null;
    if (timestamp === null) return value;
    const formatter = /^\d{4}-\d{2}-\d{2}$/.test(value) ? dateOnly : dateTime;
    return <time dateTime={value}>{formatter.format(timestamp)}</time>;
  }
  if (typeof value === 'number') return numberFormat.format(value);
  if (typeof value === 'boolean') return value ? '예' : '아니요';
  if (typeof value !== 'object' || value === null) return String(value);
  if (ancestors.includes(value)) return '앞의 항목을 참조함';

  const nextAncestors = [...ancestors, value];
  if (Array.isArray(value)) {
    return (
      <ul className="okf-graph-meta-values">
        {value.map((item, index) => <li key={index}><MetadataValue field={field} value={item} ancestors={nextAncestors} /></li>)}
      </ul>
    );
  }

  const fields = Object.entries(value);
  return fields.length > 0 ? <MetadataFields fields={fields} ancestors={nextAncestors} /> : '값 없음';
}
