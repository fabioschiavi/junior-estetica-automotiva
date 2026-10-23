// A volta no box: o circuito se enche em uma volta de 6 s quando o bloco chega (a volta do Kimi).
// O ritmo vem da curvatura do próprio traçado: freia nas curvas e solta nas retas.
// Cada marco aceso liga a etapa correspondente; na bandeirada aparece o "Finalizado".

import { $, $$, assina, calmo, clamp01, quandoEntrar } from './motor.js';

const VOLTA_MS = 6000;
const FREIO = 9;
const ESFRIA_MS = 800;
const MARCOS = [0.15, 0.4, 0.63, 0.86];
const AMOSTRAS = 600;

export function volta() {
  const palco = $('#pistaPalco');
  if (!palco) return;
  const caminho = $('#pistaVolta');
  const cabeca = $('#cabeca');
  const brilho = $('#cabecaBrilho');
  const svg = $('.pista-svg', palco);
  const etapas = $$('#etapas .etapa');
  const bandeirada = $('#bandeirada');
  const total = caminho.getTotalLength();

  // amostra o traçado e monta a tabela tempo → distância com freio nas curvas
  const pts = [];
  for (let i = 0; i <= AMOSTRAS; i++) { const p = caminho.getPointAtLength((i / AMOSTRAS) * total); pts.push([p.x, p.y]); }
  const curva = pts.map((_, i) => {
    if (i === 0 || i === AMOSTRAS) return 0;
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
    const l = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1);
    return Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / l)));
  });
  const suave = curva.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - 6); j <= Math.min(AMOSTRAS, i + 6); j++) { s += curva[j]; n++; } return s / n; });
  const tempo = [0];
  for (let i = 1; i <= AMOSTRAS; i++) tempo.push(tempo[i - 1] + (total / AMOSTRAS) * (1 + FREIO * suave[i]));
  const fim = tempo[AMOSTRAS];
  const distEm = (k) => {
    const alvo = k * fim;
    let lo = 0, hi = AMOSTRAS;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (tempo[m] <= alvo) lo = m; else hi = m; }
    const r = (alvo - tempo[lo]) / ((tempo[hi] - tempo[lo]) || 1);
    return ((lo + r) / AMOSTRAS) * total;
  };

  // marcos numerados sobre o traçado
  const grupo = $('#marcos');
  const marcos = MARCOS.map((f, i) => {
    const p = caminho.getPointAtLength(f * total);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'marco');
    g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    g.innerHTML = `<circle r="13"/><text>${i + 1}</text>`;
    grupo.appendChild(g);
    return { g, d: f * total, aceso: false };
  });

  caminho.style.strokeDasharray = `${total} ${total}`;
  caminho.style.strokeDashoffset = total;

  const poe = (d, calor) => {
    caminho.style.strokeDashoffset = total - d;
    const p = caminho.getPointAtLength(Math.min(d, total - .01));
    cabeca.setAttribute('cx', p.x); cabeca.setAttribute('cy', p.y);
    brilho.setAttribute('cx', p.x); brilho.setAttribute('cy', p.y);
    brilho.style.opacity = calor; cabeca.style.opacity = calor;
    marcos.forEach((m, i) => {
      if (!m.aceso && d >= m.d) { m.aceso = true; m.g.classList.add('aceso'); etapas[i]?.classList.add('aceso'); }
    });
  };

  const chegada = () => { bandeirada.classList.add('chegou'); window.__volta = 'fim'; };

  if (calmo) { quandoEntrar(palco, () => { poe(total, 0); chegada(); }); return; }

  quandoEntrar(palco, () => {
    svg.classList.add('correndo');
    let t0 = 0;
    const solta = assina((t) => {
      t0 = t0 || t;
      const k = clamp01((t - t0) / VOLTA_MS);
      const e = -(Math.cos(Math.PI * k) - 1) / 2;   // ease-in-out sine
      const esfria = k < 1 ? 1 : 1 - clamp01((t - t0 - VOLTA_MS) / ESFRIA_MS);
      poe(distEm(e), esfria);
      if (k >= 1 && !bandeirada.classList.contains('chegou')) chegada();
      if (k >= 1 && esfria <= 0) { solta(); svg.classList.remove('correndo'); }
    });
  }, { margem: '0px', limiar: 0.35 });
}
