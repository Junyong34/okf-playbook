// OKF v0.2 concept-document checker (lightweight, in-browser, no dependencies).
// Markup:
// <div class="okf-check"
//      data-path="policies/returns.md"                       // bundle-relative path of the doc being written
//      data-known="index.md,policies/returns.md,..."         // files that exist in the practice bundle
//      data-goal-links="policies/return-exceptions.md,..."   // optional: links the exercise asks for
//      data-mode="concept|index"                           // optional, default concept
//      data-placeholder="..."></div>
// Checks follow SPEC §3.1, §4.1, §6.1, §8, §11, §12. YAML parsing is a heuristic subset
// (top-level `key: value`, flow lists/maps, indented continuations), not a full parser.
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

  function resolveLink(docPath, target) {
    if (target.startsWith('/')) return normalize(target.slice(1).split('/'));
    const dir = docPath.split('/').slice(0, -1);
    return normalize(dir.concat(target.split('/')));
  }

  function parseFrontmatter(lines, report) {
    const keys = {};
    let lastKey = null;
    lines.forEach((raw, idx) => {
      const n = idx + 2; // line number in the file (line 1 is the opening ---)
      if (/^\s*(#.*)?$/.test(raw)) return;
      if (/^\t/.test(raw) || /^ *\t/.test(raw)) { report.push(['error', `${n}행: YAML 들여쓰기에 탭을 쓸 수 없습니다.`]); return; }
      if (/^\s/.test(raw)) {
        if (!lastKey) report.push(['error', `${n}행: 들여쓴 줄 앞에 속할 키가 없습니다.`]);
        else keys[lastKey].block = true;
        return;
      }
      const m = raw.match(/^([A-Za-z_][\w-]*)\s*:(?:\s+(.*))?$/);
      if (!m) { report.push(['error', `${n}행: \`키: 값\` 형식이 아닙니다 (콜론 뒤 공백 확인). → ${raw.trim()}`]); return; }
      const [, key, rawVal = ''] = m;
      const val = rawVal.replace(/\s+#.*$/, '').trim();
      if (keys[key]) report.push(['error', `${n}행: \`${key}\` 키가 중복되었습니다.`]);
      const pairs = { '[': ']', '{': '}', '"': '"', "'": "'" };
      if (pairs[val[0]] && val[val.length - 1] !== pairs[val[0]]) {
        report.push(['error', `${n}행: \`${key}\` 값의 ${val[0]} 가 닫히지 않았습니다.`]);
      }
      keys[key] = { value: val, line: n, block: false };
      lastKey = key;
    });
    return keys;
  }

  function checkLinks(path, body, known, goals, report) {
    const linkRe = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    const found = new Set();
    let m;
    while ((m = linkRe.exec(body))) {
      const target = m[2];
      if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
      const clean = target.split('#')[0];
      const resolved = resolveLink(path, clean);
      if (resolved === null) { report.push(['warn', `링크 \`${target}\`가 번들 루트 밖을 가리킵니다.`]); continue; }
      const exists = known.has(resolved) || known.has(resolved.replace(/\/$/, '') + '/index.md');
      found.add(resolved);
      report.push(exists
        ? ['ok', `링크 \`${target}\` → \`${resolved}\``]
        : ['warn', `끊어진 링크 \`${target}\` → \`${resolved}\` 가 번들에 없습니다. 거부하지 않고 계속 읽습니다 (§6.1, §11).`]);
    }
    goals.forEach((g) => {
      if (!found.has(g)) report.push(['warn', `과제: \`${g}\`로 가는 링크가 아직 없습니다.`]);
    });
  }

  function split(text, report, required) {
    const lines = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n');
    if (lines[0] !== '---') {
      if (required) report.push(['error', '첫 줄이 `---`가 아닙니다. frontmatter는 파일 맨 위에서 시작해야 합니다 (§4).']);
      return { fm: null, body: lines.join('\n'), ok: !required };
    }
    const close = lines.indexOf('---', 1);
    if (close === -1) { report.push(['error', '닫는 `---` 줄이 없습니다 (§4).']); return { fm: null, body: '', ok: false }; }
    const fm = parseFrontmatter(lines.slice(1, close), report);
    return { fm, body: lines.slice(close + 1).join('\n'), ok: true };
  }

  function summarize(report, okMsg) {
    const errors = report.filter((r) => r[0] === 'error').length;
    report.unshift(errors ? ['error', `오류 ${errors}개. 아직 명세에 맞지 않습니다.`] : ['ok', okMsg]);
    return report;
  }

  function checkConcept(path, text, known, goals) {
    const report = [];
    const base = path.split('/').pop();
    if (!path.endsWith('.md')) report.push(['error', '경로는 `.md`로 끝나야 합니다.']);
    if (RESERVED.includes(base)) report.push(['error', `\`${base}\`는 예약 이름이라 개념 문서에 쓸 수 없습니다 (§3.1).`]);
    else if (path.endsWith('.md')) report.push(['info', `개념 ID: \`${path.slice(0, -3)}\`. 파일 경로에서 자동으로 정해지므로 frontmatter에 쓰지 않는다 (§2).`]);

    const { fm, body, ok } = split(text, report, true);
    if (!ok || !fm) return summarize(report, '');
    const typeVal = fm.type && fm.type.value.replace(/^["']|["']$/g, '').trim();
    if (!fm.type) report.push(['error', '`type` 키가 없습니다. 모든 개념에 필요한 유일한 키입니다 (§4.1, §11).']);
    else if (!typeVal) report.push(['error', '`type` 값이 비어 있습니다 (§11).']);
    else report.push(['ok', `type: ${typeVal}`]);

    ['title', 'description', 'tags'].forEach((k) => {
      if (!fm[k]) report.push(['info', `권장 필드 \`${k}\` 없음. 없어도 적합합니다 (§4.1).`]);
    });
    if (!fm.resource) report.push(['info', '`resource` 생략됨. 테이블·API처럼 가리킬 실물 자산이 있을 때만 쓴다. 정책·절차는 생략이 정상이다 (§4.1).']);
    if (!body.trim()) report.push(['info', '본문이 비어 있습니다. 검색기가 읽을 내용이 없습니다.']);

    checkLinks(path, body, known, goals, report);
    return summarize(report, '적합한 개념 문서입니다 (§11 기준 간이 검사).');
  }

  function checkIndex(path, text, known, goals) {
    const report = [];
    const isRoot = path === 'index.md';
    if (path.split('/').pop() !== 'index.md') report.push(['error', '인덱스 파일 이름은 `index.md`여야 합니다 (§3.1).']);

    const { fm, body } = split(text, report, false);
    if (fm) {
      const keys = Object.keys(fm);
      if (!isRoot) report.push(['error', '하위 디렉터리 `index.md`에는 frontmatter를 둘 수 없습니다 (§8).']);
      keys.filter((k) => k !== 'okf_version').forEach((k) =>
        report.push(['error', `\`index.md\` frontmatter에는 \`okf_version\`만 둘 수 있습니다. \`${k}\` 제거 (§8, §12).`]));
      if (fm.okf_version) {
        const v = fm.okf_version.value;
        if (/^["']0\.2["']$/.test(v)) report.push(['ok', 'okf_version: "0.2"']);
        else if (v === '0.2') report.push(['warn', '`okf_version: 0.2`는 YAML에서 숫자가 됩니다. 명세 예시처럼 `"0.2"`로 따옴표를 씁니다 (§12).']);
        else report.push(['warn', `okf_version 값이 \`${v}\`입니다. 이 실습은 \`"0.2"\`를 씁니다.`]);
      }
    } else if (isRoot) {
      report.push(['info', '루트 인덱스에 `okf_version: "0.2"` 선언이 없습니다. 선택이지만 이 실습에서는 넣습니다 (§12).']);
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
    checkLinks(path, body, known, goals, report);
    return summarize(report, '명세에 맞는 인덱스입니다 (§8 기준 간이 검사).');
  }

  function check(path, text, known, goals, mode) {
    path = path.trim().replace(/^\/+/, '');
    return (mode === 'index' ? checkIndex : checkConcept)(path, text, known, goals);
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
      out.replaceChildren(...check(pathIn.value, ta.value, known, goals, el.dataset.mode).map(([level, msg]) => {
        const li = document.createElement('li');
        li.className = level;
        li.innerHTML = msg.replace(/`([^`]+)`/g, '<code>$1</code>');
        return li;
      }));
    });
  }

  window.OKFCheck = { check, resolveLink };
  function init() { document.querySelectorAll('.okf-check').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
