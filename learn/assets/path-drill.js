// Link and path-field resolution drill (SPEC v0.3 §6, §6.2, §12.1).
// Requires okf-check.js (window.OKFCheck.resolveLink / resolvePathField) loaded first.
// Markup:
// <div class="path-drill"
//      data-known="index.md,policies/returns.md,..."   // optional: files in the bundle (needed for the v0.2 fallback)
//      data-items='[{"from":"policies/returns.md","link":"../processes/refunds.md"},
//                   {"from":"policies/returns.md","field":"sources[].resource","link":"references/x.md","version":"0.2"}]'></div>
//  - Without "field", the item is a body link: §6 rules only, never the v0.2 fallback.
//  - With "field", the item is a path field: §6 rules, then the v0.2 fallback (§6.2, §12.1)
//    when the bundle declares okf_version 0.2 or earlier, or declares none ("version": null).
//  - "version" (when the key is present) is shown in its own column. Omit the key for v0.3-only drills.
// The learner types the bundle-relative path. A value that escapes the bundle root expects the answer "밖".
(function () {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  function init() {
    document.querySelectorAll('.path-drill').forEach((el) => {
      const items = JSON.parse(el.dataset.items || '[]');
      const known = new Set((el.dataset.known || '').split(',').map((s) => s.trim()).filter(Boolean));
      const showVersion = items.some((it) => 'version' in it);
      const table = document.createElement('table');
      table.innerHTML = '<tr><th>이 문서 안에서</th><th>링크 / 경로 필드</th>'
        + (showVersion ? '<th>번들 <code>okf_version</code></th>' : '')
        + '<th>가리키는 번들 경로</th><th></th></tr>';
      items.forEach((item) => {
        const { from, link, field } = item;
        let expected;
        let legacy = false;
        if (field) {
          const r = window.OKFCheck.resolvePathField(known, item.version, from, link);
          expected = r.target;
          legacy = r.legacy;
        } else {
          let v = link.split('#')[0];
          try { v = decodeURI(v); } catch (e) { /* keep */ }
          expected = window.OKFCheck.resolveLink(from, v);
        }
        const what = field ? `<code>${esc(field)}: ${esc(link)}</code>` : `본문 링크 <code>${esc(link)}</code>`;
        const version = !showVersion ? '' : `<td>${!('version' in item) ? '' : item.version === null ? '선언 없음' : `<code>"${esc(item.version)}"</code>`}</td>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${esc(from)}</code></td><td>${what}</td>${version}
          <td><input spellcheck="false" placeholder="예: policies/x.md"></td><td class="mark" aria-live="polite"></td>`;
        const input = tr.querySelector('input');
        const mark = tr.querySelector('.mark');
        const grade = () => {
          const v = input.value.trim().replace(/^\/+/, '');
          if (!v) { mark.textContent = ''; return; }
          const ok = expected === null ? v.includes('밖') : v === expected;
          mark.textContent = ok ? (legacy ? '✓ v0.2 대체 해석' : '✓') : '✕';
          mark.style.color = ok ? 'var(--ok)' : 'var(--err)';
          input.title = ok ? '' : '다시 생각해 보세요';
        };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') grade(); });
        input.addEventListener('blur', grade);
        table.appendChild(tr);
      });
      el.replaceChildren(table);
      const hint = document.createElement('p');
      hint.className = 'note';
      hint.textContent = 'Enter 또는 칸을 벗어나면 채점합니다. 번들 루트 밖이면 "밖"이라고 씁니다.'
        + (items.some((it) => it.field) ? ' 경로 필드는 파일 기준으로 먼저 찾고, 번들에 없을 때만 버전에 따라 대체 해석을 생각합니다. 본문 링크에는 대체 해석이 없습니다.' : '');
      el.appendChild(hint);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
