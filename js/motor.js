// Motor compartilhado: um único laço de rAF (como o ticker do Kimi), gatilhos de entrada na tela,
// divisão de texto em palavras e o desenho da bandeira quadriculada se desfazendo.

export const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const toque = matchMedia('(hover: none), (pointer: coarse)').matches;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- ticker: quem assina recebe (tempo, dt) a cada quadro; o laço para sozinho sem assinantes ---------- */
const assinantes = new Set();
let raf = 0;
let ultimo = 0;
const volta = (t) => {
  const dt = Math.min(64, t - (ultimo || t));
  ultimo = t;
  for (const fn of [...assinantes]) fn(t, dt);
  raf = assinantes.size ? requestAnimationFrame(volta) : 0;
};
export function assina(fn) {
  assinantes.add(fn);
  if (!raf) { ultimo = 0; raf = requestAnimationFrame(volta); }
  return () => assinantes.delete(fn);
}

/* ---------- entra na tela uma vez ---------- */
export function quandoEntrar(el, fn, { margem = '0px 0px -18% 0px', limiar = 0 } = {}) {
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { io.disconnect(); fn(e.target); }
  }, { rootMargin: margem, threshold: limiar });
  io.observe(el);
}

/* ---------- roda enquanto está na tela (mais dez quadros, regra do Kimi) ---------- */
export function enquantoVisivel(el, fn) {
  let solta = null;
  let sobra = 0;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { sobra = Infinity; if (!solta) solta = assina(tick); }
    else sobra = 10;
  });
  const tick = (t, dt) => { fn(t, dt); if (sobra !== Infinity && --sobra <= 0) { solta(); solta = null; } };
  io.observe(el);
}

/* progresso de rolagem de um elemento: 0 quando o topo passa pela linha `inicio` da tela (1 = pé da tela),
   1 quando o fim passa pela linha `fim` (0 = topo) */
export function progresso(el, inicio = 1, fim = 0) {
  const r = el.getBoundingClientRect();
  const vh = innerHeight;
  return clamp01((vh * inicio - r.top) / (vh * inicio - vh * fim + r.height || 1));
}

/* ---------- texto em palavras ---------- */
export function emPalavras(el, classe = 'pal') {
  if (el.dataset.dividido) return [];
  el.dataset.dividido = '1';
  const texto = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', texto);
  // palavras de um <em> continuam com a ênfase (o itálico largo do logo)
  const partes = [];
  el.childNodes.forEach((n) => {
    const enfase = n.nodeType === 1 && n.tagName === 'EM';
    n.textContent.split(/\s+/).filter(Boolean).forEach((p) => partes.push([p, enfase]));
  });
  el.textContent = '';
  return partes.map(([p, enfase], i) => {
    const s = document.createElement('span');
    s.className = enfase ? `${classe} enfase` : classe;
    s.style.setProperty('--i', i);
    s.setAttribute('aria-hidden', 'true');
    s.textContent = p;
    el.appendChild(s);
    if (i < partes.length - 1) el.appendChild(document.createTextNode(' '));
    return s;
  });
}

/* ---------- bandeira quadriculada se desfazendo (o seam do Kimi, verbatim nas constantes) ---------- */
const hash = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export function xadrez(ctx, largura, altura, prog, { celula = 24, solidoAte = 0.16, sobe = 2, cor, acento, partAcento = 0.06, inverte = false }) {
  ctx.clearRect(0, 0, largura, altura);
  const cols = Math.ceil(largura / celula);
  const linhas = Math.ceil(altura / celula);
  const lift = prog * sobe;
  for (let y = 0; y < linhas; y++) {
    const yy = inverte ? linhas - 1 - y : y;
    const prof = y / Math.max(1, linhas - 1) + lift;
    if (prof > 1) break;
    const solido = prof <= solidoAte;
    const some = clamp01(1 - (prof - solidoAte) / (1 - solidoAte));
    if (!solido && some <= 0) break;
    for (let x = 0; x < cols; x++) {
      if (!solido) {
        if ((x + yy) % 2 !== 0) continue;
        if (hash(x, yy) > some) continue;
      }
      ctx.fillStyle = !solido && hash(x + 101, yy + 57) < partAcento ? acento : cor;
      ctx.fillRect(x * celula, yy * celula, celula + 0.5, celula + 0.5);
    }
  }
}

export function ajustaCanvas(cv, dprMax = 2) {
  const dpr = Math.min(devicePixelRatio || 1, toque ? 1.5 : dprMax);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export const cores = {
  box: '#E6E8E9', noite: '#0E0F11', tinta: '#1B1E21', piso: '#C8161D', cromo: '#FFFFFF',
};
