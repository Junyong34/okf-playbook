// Korean bigram keyword-matching lab. Same algorithm as src/okf/retrieve.ts bigrams() + score().
// Markup:
// <div class="bigram-lab" data-question="초기 질문" data-min="2"
//      data-docs='[{"path":"policies/returns.md","text":"검색 대상 텍스트"}]'></div>
(function () {
  function bigrams(text) {
    const out = new Set();
    for (const word of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) {
      const chars = [...word];
      for (let i = 0; i + 1 < chars.length; i++) out.add(chars[i] + chars[i + 1]);
    }
    return out;
  }
  function init() {
    document.querySelectorAll('.bigram-lab').forEach((el) => {
      const docs = JSON.parse(el.dataset.docs || '[]').map((d) => ({ ...d, set: bigrams(d.text) }));
      const min = Number(el.dataset.min || 2);
      el.innerHTML = `<label>질문</label><input class="q" spellcheck="false">
        <p class="grams note"></p><table class="res"></table>`;
      const input = el.querySelector('input.q');
      const grams = el.querySelector('.grams');
      const table = el.querySelector('table.res');
      input.value = el.dataset.question || '';
      const render = () => {
        const q = [...bigrams(input.value)];
        grams.innerHTML = '질문의 두 글자 묶음: ' + (q.map((g) => `<code>${g}</code>`).join(' ') || '(없음)');
        const rows = docs
          .map((d) => ({ d, m: q.filter((g) => d.set.has(g)).sort() }))
          .sort((a, b) => b.m.length - a.m.length || a.d.path.localeCompare(b.d.path));
        table.innerHTML = '<tr><th>개념</th><th>점수</th><th>겹친 묶음</th><th></th></tr>' + rows.map(({ d, m }) =>
          `<tr><td><code>${d.path}</code></td><td>${m.length}</td><td>${m.map((g) => `<code>${g}</code>`).join(' ')}</td>
           <td>${m.length >= min ? '<span style="color:var(--ok)">선택</span>' : `<span style="color:var(--muted)">${min}점 미만</span>`}</td></tr>`).join('');
      };
      input.addEventListener('input', render);
      render();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
