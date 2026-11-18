// Link-path resolution drill. Requires okf-check.js (window.OKFCheck.resolveLink) loaded first.
// Markup:
// <div class="path-drill" data-items='[{"from":"policies/returns.md","link":"../processes/refunds.md"}]'></div>
// The learner types the bundle-relative path the link resolves to (SPEC §6.1).
// A link that escapes the bundle root expects the answer "밖".
(function () {
  function init() {
    document.querySelectorAll('.path-drill').forEach((el) => {
      const items = JSON.parse(el.dataset.items || '[]');
      const table = document.createElement('table');
      table.innerHTML = '<tr><th>이 문서 안에서</th><th>링크</th><th>가리키는 번들 경로</th><th></th></tr>';
      items.forEach(({ from, link }) => {
        const expected = window.OKFCheck.resolveLink(from, link.split('#')[0]);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${from}</code></td><td><code>${link}</code></td>
          <td><input spellcheck="false" placeholder="예: policies/x.md"></td><td class="mark" aria-live="polite"></td>`;
        const input = tr.querySelector('input');
        const mark = tr.querySelector('.mark');
        const grade = () => {
          const v = input.value.trim().replace(/^\/+/, '');
          if (!v) { mark.textContent = ''; return; }
          const ok = expected === null ? v.includes('밖') : v === expected;
          mark.textContent = ok ? '✓' : '✕';
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
      hint.textContent = 'Enter 또는 칸을 벗어나면 채점합니다. 번들 루트 밖이면 "밖"이라고 씁니다.';
      el.appendChild(hint);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
