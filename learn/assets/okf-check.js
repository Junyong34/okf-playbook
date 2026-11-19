// OKF v0.3 concept-document checker (lightweight, in-browser, no dependencies).
// Markup:
// <div class="okf-check"
//      data-path="policies/returns.md"                       // bundle-relative path of the doc being written
//      data-known="index.md,policies/returns.md,..."         // files that exist in the practice bundle
//      data-goal-links="policies/return-exceptions.md,..."   // optional: links the exercise asks for
//      data-mode="concept|index"                           // optional, default concept
//      data-team-rules="on"                                // optional: report team/* rules as warnings (default: info)
//      data-placeholder="..."></div>
// Levels follow src/okf/validate.ts (rule ids in [brackets]): only unparsable frontmatter and reserved-file
// structure are errors; a .md without frontmatter or `type` is "not a concept" (warning, SPEC §3.2).
// Checks follow SPEC v0.3 §3.1, §3.2, §4, §4.1, §5, §6, §8, §8.1, §11. YAML parsing is a heuristic subset
// (top-level `key: value`, flow lists/maps, indented continuations), not a full parser.
// window.OKFCheck = { check, resolveLink, resolvePathField, parseTimestamp } (also module.exports for node).
(function () {
  const RESERVED = ['index.md', 'log.md'];

  function normalize(parts) {
    const out = [];
    for (const p of parts) {
      if (p === '' || p === '.') continue;
      if (p === '..') { if (!out.length) return null; out.pop(); } else out.push(p);
    }
    return out.join('/');
  }

  // §6: '/' → bundle root, otherwise the directory of the file. null = outside the bundle root (external).
  function resolveLink(docPath, target) {
    if (target.startsWith('/')) return normalize(target.slice(1).split('/'));
    const dir = docPath.split('/').slice(0, -1);
    return normalize(dir.concat(target.split('/')));
  }

  // §6.2, §12.1: v0.2 fallback for path fields only. Same as allowsLegacyPaths/resolvePathField in src/okf/concept.ts.
  // version: declared okf_version of the bundle, null/undefined = no declaration.
  function allowsLegacyPaths(version) {
    if (version === null || version === undefined || version === '') return true;
    const m = String(version).match(/^(\d+)\.(\d+)/);
    return !!m && Number(m[1]) === 0 && Number(m[2]) <= 2;
  }

  function resolvePathField(known, version, from, value) {
    let v = value.split('#')[0];
    try { v = decodeURI(v); } catch (e) { /* keep */ }
    const target = resolveLink(from, v);
    if (v.startsWith('/') || (target !== null && known.has(target)) || !allowsLegacyPaths(version)) return { target, legacy: false };
    const fromRoot = resolveLink('index.md', v);
    if (fromRoot !== null && known.has(fromRoot)) return { target: fromRoot, legacy: true };
    return { target, legacy: false };
  }

  // §5 Timestamps: date-time with an offset, or date only (start of that day in UTC). Same as parseTimestamp in concept.ts.
  const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
  function validDay(y, m, d) {
    const t = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return t.getUTCFullYear() === Number(y) && t.getUTCMonth() === Number(m) - 1 && t.getUTCDate() === Number(d);
  }
  function parseTimestamp(v) {
    if (typeof v !== 'string') return null;
    const d = v.match(DATE_RE);
    if (d) return validDay(d[1], d[2], d[3]) ? Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3])) : null;
    const dt = v.match(DATETIME_RE);
    if (!dt || !validDay(dt[1], dt[2], dt[3])) return null;
    if (Number(dt[4]) > 23 || Number(dt[5]) > 59 || Number(dt[6]) > 59) return null;
    const t = Date.parse(v.toUpperCase());
    return Number.isNaN(t) ? null : t;
  }

  const unquote = (v) => String(v).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  // §11.2-1: null, an empty string, and an empty list are the same as an absent key.
  const isBlank = (v) => v === undefined || /^(|~|null|Null|NULL|""|''|\[\s*\])$/.test(String(v).trim());

  function parseFrontmatter(lines, report) {
    const keys = {};
    let lastKey = null;
    lines.forEach((raw, idx) => {
      const n = idx + 2; // line number in the file (line 1 is the opening ---)
      if (/^\s*(#.*)?$/.test(raw)) return;
      if (/^\t/.test(raw) || /^ *\t/.test(raw)) { report.push(['error', `${n}행: YAML 들여쓰기에 탭을 쓸 수 없습니다. [yaml-parse]`]); return; }
      if (/^\s/.test(raw)) {
        if (!lastKey) report.push(['error', `${n}행: 들여쓴 줄 앞에 속할 키가 없습니다. [yaml-parse]`]);
        else { keys[lastKey].block = true; keys[lastKey].lines.push(raw); }
        return;
      }
      const m = raw.match(/^([A-Za-z_][\w-]*)\s*:(?:\s+(.*))?$/);
      if (!m) { report.push(['error', `${n}행: \`키: 값\` 형식이 아닙니다 (콜론 뒤 공백 확인). → ${raw.trim()} [yaml-parse]`]); return; }
      const [, key, rawVal = ''] = m;
      const val = rawVal.replace(/\s+#.*$/, '').trim();
      if (keys[key]) report.push(['error', `${n}행: \`${key}\` 키가 중복되었습니다 (§4). [yaml-parse]`]);
      const pairs = { '[': ']', '{': '}', '"': '"', "'": "'" };
      if (pairs[val[0]] && val[val.length - 1] !== pairs[val[0]]) {
        report.push(['error', `${n}행: \`${key}\` 값의 ${val[0]} 가 닫히지 않았습니다. [yaml-parse]`]);
      }
      keys[key] = { value: val, line: n, block: false, lines: [] };
      lastKey = key;
    });
    return keys;
  }

  // Text of a key: its inline value plus indented continuation lines.
  const keyText = (k) => (k ? [k.value].concat(k.lines).join('\n') : '');
  const field = (text, name) => {
    const m = text.match(new RegExp(`(?:^|[{,\\s-])${name}\\s*:\\s*("[^"]*"|'[^']*'|[^,}\\n]*)`));
    return m ? unquote(m[1]) : undefined;
  };
  // Items of a list-valued key (§11.2-2: one mapping without a dash is a list with one item).
  function listItems(k) {
    if (!k) return [];
    const v = k.value.trim();
    if (!k.block) {
      if (isBlank(v)) return [];
      if (v.startsWith('[')) return (v.slice(1, -1).match(/\{[^}]*\}/g) || []);
      return [v];
    }
    const items = [];
    let cur = null;
    k.lines.forEach((l) => {
      if (/^\s*-(\s|$)/.test(l)) { if (cur !== null) items.push(cur); cur = l.replace(/^\s*-\s*/, ''); }
      else if (cur !== null) cur += '\n' + l;
      else cur = l; // block mapping without a dash
    });
    if (cur !== null) items.push(cur);
    return items;
  }

  // §5, §5.2, §11.2: warnings that validate.ts also gives (bad-timestamp, incomplete-verified).
  function checkLifecycle(fm, report) {
    const badTime = (key, v) => {
      if (!isBlank(v) && parseTimestamp(unquote(v)) === null) {
        report.push(['warn', `\`${key}: ${v}\`는 허용된 시각 형식(오프셋 있는 date-time, 날짜만)이 아닙니다 (§5). [bad-timestamp]`]);
      }
    };
    listItems(fm.verified).forEach((item, i) => {
      const by = field(item, 'by');
      const at = field(item, 'at');
      if (isBlank(by) || isBlank(at)) {
        report.push(['warn', `verified ${i + 1}번째 항목에 \`by\`와 \`at\`이 둘 다 있어야 합니다. 소비자는 이 항목을 무시합니다 (§5.2, §11.2). [incomplete-verified]`]);
      } else badTime(`verified[${i}].at`, at);
    });
    if (fm.generated) badTime('generated.at', field(keyText(fm.generated), 'at'));
    if (fm.stale_after) badTime('stale_after', fm.stale_after.value);
  }

  function checkLinks(path, body, known, goals, report, teamRules) {
    const linkRe = /(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    const found = new Set();
    let m;
    while ((m = linkRe.exec(body))) {
      const target = m[2];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      let clean = target.split('#')[0];
      try { clean = decodeURI(clean); } catch (e) { /* keep */ }
      const resolved = resolveLink(path, clean);
      if (resolved === null) { report.push(['warn', `링크 \`${target}\`가 번들 루트 밖을 가리킵니다. 외부 값이라 읽지 않습니다 (§6). [link-outside-bundle]`]); continue; }
      if (target.startsWith('/')) {
        report.push([teamRules ? 'warn' : 'info', `링크 \`${target}\`: 명세에는 맞지만, 이 실습 팀 규칙(레슨 0002)은 번들 안 링크를 상대 경로로 씁니다. [team/relative-links]`]);
      }
      const exists = known.has(resolved) || known.has(resolved.replace(/\/$/, '') + '/index.md');
      found.add(resolved);
      report.push(exists
        ? ['ok', `링크 \`${target}\` → \`${resolved}\``]
        : ['warn', `끊어진 링크 \`${target}\` → \`${resolved}\` 가 번들에 없습니다. 거부하지 않고 계속 읽습니다 (§6.1, §11.2). [broken-link]`]);
    }
    goals.forEach((g) => {
      if (!found.has(g)) report.push(['warn', `과제: \`${g}\`로 가는 링크가 아직 없습니다.`]);
    });
  }

  // fm: null = no frontmatter block. opened: the first line is '---' (an unclosed block is unparsable, §4).
  function split(text, report) {
    const lines = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n');
    if (lines[0] !== '---') return { fm: null, body: lines.join('\n'), parsed: true };
    const close = lines.indexOf('---', 1);
    if (close === -1) { report.push(['error', '여는 `---`는 있는데 닫는 `---` 줄이 없습니다 (§4). [yaml-parse]']); return { fm: null, body: lines.join('\n'), parsed: false }; }
    const before = report.length;
    const fm = parseFrontmatter(lines.slice(1, close), report);
    const parsed = !report.slice(before).some((r) => r[0] === 'error');
    return { fm, body: lines.slice(close + 1).join('\n'), parsed };
  }

  function summarize(report, okMsg, notConcept) {
    const errors = report.filter((r) => r[0] === 'error').length;
    if (errors) report.unshift(['error', `오류 ${errors}개. 아직 명세에 맞지 않습니다.`]);
    else if (notConcept) report.unshift(['warn', '개념이 아닌 파일입니다. 번들 적합성에는 영향이 없지만 소비자(검색기)가 건너뜁니다 (§3.2). [not-a-concept]']);
    else report.unshift(['ok', okMsg]);
    return report;
  }

  function checkConcept(path, text, known, goals, teamRules) {
    const report = [];
    const base = path.split('/').pop();
    if (path.split('/').some((part) => part.startsWith('.'))) report.push(['warn', '이름이 `.`으로 시작하는 파일·디렉터리는 번들에 들지 않습니다 (§3.2).']);
    if (!path.endsWith('.md')) report.push(['warn', '`.md`가 아닌 파일은 asset입니다. 개념이 아닙니다 (§3.2).']);
    if (RESERVED.includes(base)) report.push(['error', `\`${base}\`는 예약 이름이라 개념 문서에 쓸 수 없습니다. frontmatter가 있어도 개념으로 읽지 않습니다 (§3.1).`]);
    else if (path.endsWith('.md')) report.push(['info', `개념 ID: \`${path.slice(0, -3)}\`. 파일 경로에서 자동으로 정해지므로 frontmatter에 쓰지 않는다 (§2).`]);

    const { fm, body, parsed } = split(text, report);
    let notConcept = false;
    if (!parsed) {
      // yaml-parse 오류만 낸다. 개념 판별과 수명 검사는 건너뛰고 링크는 계속 본다 (validate.ts와 같다).
    } else if (!fm) {
      notConcept = true;
      report.push(['warn', '첫 줄이 `---`가 아니라 frontmatter가 없습니다. 개념이 아닌 파일입니다 (§3.2, §4). [not-a-concept]']);
    } else {
      const typeVal = fm.type && !fm.type.block ? unquote(fm.type.value).trim() : '';
      if (!typeVal) {
        notConcept = true;
        report.push(['warn', `${fm.type ? '`type` 값이 비어 있습니다' : '`type` 키가 없습니다'}. 비어 있지 않은 \`type\`이 있어야 개념입니다 (§3.2, §4.1). [not-a-concept]`]);
      } else {
        report.push(['ok', `type: ${typeVal}`]);
        ['title', 'description', 'tags'].forEach((k) => {
          if (!fm[k] || (isBlank(fm[k].value) && !fm[k].block)) report.push(['info', `선택 필드 \`${k}\` 없음. 없어도 적합합니다 (§4.1).`]);
        });
        if (fm.tags && !fm.tags.block && !isBlank(fm.tags.value) && !/^\[/.test(fm.tags.value)) {
          report.push(['info', `\`tags: ${fm.tags.value}\`는 태그 하나로 읽습니다. 쉼표로 나누지 않습니다 (§11.2). 여러 개면 \`[a, b]\` 목록으로 씁니다.`]);
        }
        if (!fm.resource) report.push(['info', '`resource` 생략됨. 테이블·API처럼 가리킬 실물 자산이 있을 때만 쓴다. 정책·절차는 생략이 정상이다 (§4.1).']);
        Object.keys(fm).filter((k) => /^x-/.test(k)).forEach((k) => report.push(['info', `확장 키 \`${k}\`. 소비자는 모르는 키로 문서를 거부하지 않습니다 (§4.1).`]));
        checkLifecycle(fm, report);
      }
    }
    if (!body.trim()) report.push(['info', '본문이 비어 있습니다. 검색기가 읽을 내용이 없습니다.']);

    checkLinks(path, body, known, goals, report, teamRules);
    return summarize(report, '적합한 개념 문서입니다 (§3.2, §11 기준 간이 검사).', notConcept);
  }

  function checkIndex(path, text, known, goals, teamRules) {
    const report = [];
    const isRoot = path === 'index.md';
    if (path.split('/').pop() !== 'index.md') report.push(['error', '인덱스 파일 이름은 `index.md`여야 합니다 (§3.1).']);

    const before = report.length;
    const { fm, body, parsed } = split(text, report);
    const opened = !parsed || fm !== null;
    if (!isRoot && opened) {
      report.splice(before); // validate.ts reports any frontmatter block in a subdirectory index as index-frontmatter
      report.push(['error', '하위 디렉터리 `index.md`에는 frontmatter를 둘 수 없습니다 (§8). [index-frontmatter]']);
    } else if (isRoot && parsed) {
      const v = fm && fm.okf_version ? fm.okf_version.value : undefined;
      if (isBlank(v)) {
        report.push(['warn', '루트 인덱스에 `okf_version` 선언이 없습니다. `okf_version: "0.3"`을 두는 것을 권장합니다 (§8.1). [missing-okf-version]']);
      } else if (!/^["']/.test(v) && /^([-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?|true|false|True|False|TRUE|FALSE|0x[0-9a-fA-F]+|0o[0-7]+|\.inf|\.nan)$/.test(v)) {
        report.push(['warn', `\`okf_version: ${v}\`는 YAML에서 문자열이 아니라 숫자가 됩니다. \`"0.3"\`처럼 따옴표를 씁니다 (§4, §8.1). [unquoted-version]`]);
      } else if (unquote(v) === '0.3') report.push(['ok', 'okf_version: "0.3"']);
      else report.push(['info', `okf_version 값이 \`${v}\`입니다. 이 실습은 \`"0.3"\`을 씁니다 (§12).`]);
      if (fm) {
        if (!fm.description) report.push(['info', '번들 `description`이 없습니다. 여러 번들을 가진 에이전트가 이 한 문장으로 번들을 고릅니다 (§8.1).']);
        Object.keys(fm).filter((k) => !['okf_version', 'title', 'description', 'license'].includes(k)).forEach((k) =>
          report.push(['info', `\`${k}\`: 번들 메타데이터의 확장 키로 허용됩니다 (§4.1, §8.1).`]));
      }
    }

    const lines = body.split('\n');
    if (!lines.some((l) => /^#{1,6}\s+\S/.test(l))) report.push(['warn', '섹션 제목(`# ...`)이 없습니다. 인덱스는 제목 아래 목록으로 묶습니다 (§8).']);
    let items = 0;
    lines.forEach((l, i) => {
      if (!/^\s*[*-]\s+/.test(l)) return;
      items++;
      if (!/^\s*[*-]\s+\[[^\]]+\]\([^)]+\)/.test(l)) report.push(['warn', `본문 ${i + 1}행: \`[제목](경로)\` 링크로 시작하지 않습니다 (§8).`]);
      else if (!/\)\s+-\s+\S/.test(l)) report.push(['info', `본문 ${i + 1}행: \` - 설명\`이 없습니다. 개념의 description을 넣는 것을 권장합니다 (§8).`]);
    });
    if (!items) report.push(['warn', '목록 항목이 없습니다.']);
    checkLinks(path, body, known, goals, report, teamRules);
    return summarize(report, '명세에 맞는 인덱스입니다 (§8, §8.1 기준 간이 검사).');
  }

  function check(path, text, known, goals, mode, teamRules) {
    path = path.trim().replace(/^\/+/, '');
    return (mode === 'index' ? checkIndex : checkConcept)(path, text, known || new Set(), goals || [], !!teamRules);
  }

  function mount(el) {
    const known = new Set((el.dataset.known || '').split(',').map((s) => s.trim()).filter(Boolean));
    const goals = (el.dataset.goalLinks || '').split(',').map((s) => s.trim()).filter(Boolean);
    const storeKey = 'okf-check:' + location.pathname + ':' + (el.dataset.path || '');
    el.innerHTML = `
      <label>번들 안 경로</label>
      <input class="path" spellcheck="false">
      <label>문서 내용</label>
      <textarea class="code" spellcheck="false"></textarea>
      <button type="button" class="run">검사</button>
      <ul class="report" aria-live="polite"></ul>`;
    const pathIn = el.querySelector('.path');
    const ta = el.querySelector('textarea');
    const out = el.querySelector('.report');
    pathIn.value = el.dataset.path || 'policies/example.md';
    ta.placeholder = el.dataset.placeholder || '---\ntype: ...\n---\n\n# 제목';
    ta.value = localStorage.getItem(storeKey) || '';
    ta.addEventListener('input', () => localStorage.setItem(storeKey, ta.value));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
    });
    el.querySelector('.run').addEventListener('click', () => {
      const report = check(pathIn.value, ta.value, known, goals, el.dataset.mode, el.dataset.teamRules === 'on');
      out.replaceChildren(...report.map(([level, msg]) => {
        const li = document.createElement('li');
        li.className = level;
        li.innerHTML = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/`([^`]+)`/g, '<code>$1</code>');
        return li;
      }));
    });
  }

  const api = { check, resolveLink, resolvePathField, allowsLegacyPaths, parseTimestamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window === 'undefined') return;
  window.OKFCheck = api;
  function init() { document.querySelectorAll('.okf-check').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
