/** Start the existing native typewriter from server HTML, before the framework
 * bundle hydrates. React adopts its clock and nodes rather than restarting it. */
export const HERO_TYPING_BOOTSTRAP = String.raw`
(() => {
  const h = document.getElementById('hero-title'), s = document.getElementById('hero-line'), c = document.getElementById('hero-actions');
  if (!h || !s || !c || h.dataset.typeOwner === 'react') return;
  const title = h.dataset.text || '', line = s.dataset.text || '';
  const text = h.querySelector('.story-text')?.firstChild, sub = s.querySelector('.story-text')?.firstChild;
  const caret = h.querySelector('.story-caret'), subCaret = s.querySelector('.story-caret');
  if (!text || !sub || text.nodeType !== 3 || sub.nodeType !== 3 || !caret || !subCaret) return;
  const start = performance.now(), total = title.length * 30 + 250 + line.length * 12;
  h.dataset.typeStart = String(start);
  h.dataset.typeOwner = 'bootstrap';
  let n1 = -1, n2 = -1;
  const set = (el, full, n, previous) => {
    n = Math.max(0, Math.min(full.length, Math.round(n)));
    if (n !== previous) el.textContent = full.slice(0, n);
    return n;
  };
  text.textContent = ''; sub.textContent = '';
  h.classList.remove('story-typing-pending'); s.classList.remove('story-typing-pending');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = (now) => {
    if (h.dataset.typeOwner === 'react' || !h.isConnected) return;
    if (reduced) {
      text.textContent = title; sub.textContent = line; c.style.opacity = '1';
      caret.classList.add('story-caret-off'); subCaret.classList.add('story-caret-off'); return;
    }
    const ms = now - start, a = ms / 30, done1 = a >= title.length;
    const b = (ms - title.length * 30 - 250) / 12, done2 = b >= line.length;
    n1 = set(text, title, a, n1); n2 = set(sub, line, done1 ? b : 0, n2);
    caret.classList.toggle('story-caret-off', done1);
    subCaret.classList.toggle('story-caret-off', !(done1 && !done2));
    if (done2) c.style.opacity = '1';
    if (ms < total) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
`;
