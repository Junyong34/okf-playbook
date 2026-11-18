// Quiz component. Markup:
// <div class="quiz" data-answer="2" data-why="정답 해설 (HTML 가능)">
//   <p class="q">질문</p>
//   <ol><li>보기1</li><li>보기2</li>...</ol>
// </div>
// data-answer is 1-based. Feedback is immediate; first click counts toward the score.
(function () {
  function init() {
    const quizzes = Array.from(document.querySelectorAll('.quiz'));
    const scoreEl = document.querySelector('.quiz-score');
    let answered = 0, correct = 0;
    const update = () => { if (scoreEl) scoreEl.textContent = `${correct} / ${quizzes.length} (응답 ${answered})`; };
    quizzes.forEach((quiz) => {
      const answer = Number(quiz.dataset.answer);
      const items = Array.from(quiz.querySelectorAll('ol > li'));
      const fb = document.createElement('p');
      fb.className = 'feedback';
      fb.setAttribute('aria-live', 'polite');
      quiz.appendChild(fb);
      let first = true;
      items.forEach((li, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.innerHTML = li.innerHTML;
        li.replaceChildren(btn);
        btn.addEventListener('click', () => {
          const ok = i + 1 === answer;
          if (first) { first = false; answered++; if (ok) correct++; update(); }
          btn.classList.add(ok ? 'right' : 'wrong');
          fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
          fb.innerHTML = ok ? '맞습니다. ' + (quiz.dataset.why || '') : '아닙니다. 다른 보기를 골라 보세요.';
        });
      });
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
