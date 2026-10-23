// Junior Estética Automotiva — prévia "Bandeirada"
// Boot: véu (a marca enche) → a cena do hero fica pronta → o véu desmancha em xadrez → o piso queima e revela a Ranger.
// Depois: costuras quadriculadas, pilha sticky, volta no box, ordem de serviço, odômetro, baralho, carimbos, manifesto.

import { $, $$, assina, calmo, toque, clamp01, quandoEntrar, enquantoVisivel, progresso, emPalavras, xadrez, ajustaCanvas, cores } from './motor.js';
import { cena } from './cena.js';
import { volta } from './volta.js';
import { pedido } from './pedido.js';
import { baralho } from './baralho.js';
import { piso } from './piso.js';

const raiz = document.documentElement;
window.scrollTo(0, 0);

/* ---------- textos: palavras e blocos que sobem quando entram ---------- */
function textos() {
  $$('[data-palavras]').forEach((el) => emPalavras(el));
  $$('[data-palavras], [data-sobe]').forEach((el) => {
    if (el.closest('.hero')) return;   // o hero entra junto com a queima
    quandoEntrar(el, () => el.classList.add('dentro'));
  });
}

/* ---------- véu ---------- */
function veu(cenaPronta) {
  const veuEl = $('#veu');
  const cheio = $('#veuCentro');
  const cv = $('#veuXadrez');
  let p = 0;
  let pronto = false;
  let solto = false;
  cenaPronta.then(() => { pronto = true; });
  setTimeout(() => { pronto = true; }, 4500);   // rede de segurança

  return new Promise((sai) => {
    if (calmo) { cenaPronta.finally(() => { veuEl.remove(); sai(); }); return; }
    let desfazInicio = 0;
    let lido = 0;
    const solta = assina((t, dt) => {
      // o medidor anda sozinho até 0,7 e completa quando a cena avisa que está pronta
      const alvo = pronto ? 1 : 0.7;
      p += (alvo - p) * (pronto ? 0.16 : 0.025) * (dt / 16.7);
      veuEl.style.setProperty('--p', p.toFixed(4));
      const { ctx, w, h } = ajustaCanvas(cv, 1.5);
      if (pronto && p > 0.995 && !lido) { lido = t; veuEl.classList.add('limpa'); }
      if (lido && !desfazInicio && t - lido > 420) { desfazInicio = t; veuEl.classList.add('foi'); document.body.classList.remove('carregando'); if (!solto) { solto = true; sai(); } }
      const k = desfazInicio ? clamp01((t - desfazInicio) / 1100) : 0;
      const e = k * k * (3 - 2 * k);
      if (!desfazInicio) { ctx.fillStyle = cores.noite; ctx.fillRect(0, 0, w, h); }
      else xadrez(ctx, w, h, e, { celula: w < 900 ? 30 : 44, solidoAte: 0.9 * (1 - e), sobe: 1.3, cor: cores.noite, acento: cores.piso, partAcento: 0.08 });
      if (k >= 1) { solta(); veuEl.remove(); }
    });
  });
}

/* ---------- hero ---------- */
function hero() {
  const quadro = $('#heroQuadro');
  const foto = $('#heroFoto');
  const cv = $('#heroCena');
  const c = cena(quadro, foto, cv);
  if (!c) {
    raiz.classList.add('cena-sem');
    const pronta = foto.complete ? Promise.resolve() : new Promise((ok) => foto.addEventListener('load', ok, { once: true }));
    return { pronta, queimar: () => Promise.resolve() };
  }
  c.pronta.then(() => raiz.classList.add('cena-viva'));
  return c;
}

function entradaHero(c) {
  $$('.hero [data-palavras]').forEach((el) => el.classList.add('dentro'));
  $$('.hero [data-sobe]').forEach((el, i) => { el.style.setProperty('--d', `${350 + i * 110}ms`); el.classList.add('dentro'); });
  c.queimar().then(() => { raiz.classList.add('pronto'); chamadas(); window.__ready = true; });
}

/* chamadas que se digitam sobre a foto (Ridgeline), presas ao ponto da foto mesmo com o object-fit cover */
function chamadas() {
  const quadro = $('#heroQuadro');
  const itens = $$('#chamadas li');
  // largura final de cada etiqueta, medida antes de apagar o texto para digitar
  const larguras = itens.map((li) => $('span', li).offsetWidth);
  const posiciona = () => {
    const w = quadro.clientWidth, h = quadro.clientHeight;
    const escala = Math.max(w / 1440, h / 1920);
    const dw = 1440 * escala, dh = 1920 * escala;
    const ox = (w - dw) * 0.5, oy = (h - dh) * 0.42;
    itens.forEach((li, i) => {
      const x = Math.min(Math.max(ox + Number(li.dataset.x) * dw, 14), w - 14);
      const y = oy + Number(li.dataset.y) * dh;
      // se a etiqueta não cabe à direita do ponto, ela vira para a esquerda
      li.classList.toggle('esq', x + 22 + larguras[i] > w - 10);
      li.style.left = `${x}px`;
      li.style.top = `${y}px`;
      li.hidden = y < 30 || y > h - 90;   // ponto fora do recorte da foto nessa tela
    });
  };
  posiciona();
  new ResizeObserver(posiciona).observe(quadro);
  itens.forEach((li, i) => {
    const span = $('span', li);
    const txt = span.textContent;
    li.setAttribute('aria-label', txt);
    span.textContent = '';
    setTimeout(() => {
      li.classList.add('liga');
      if (calmo) { span.textContent = txt; return; }
      let n = 0;
      const id = setInterval(() => { span.textContent = txt.slice(0, ++n); if (n >= txt.length) clearInterval(id); }, 34);
    }, 250 + i * 700);
  });
}

/* ---------- costuras quadriculadas entre blocos (o seam do Kimi) ---------- */
function costuras() {
  $$('[data-costura]').forEach((cv) => {
    const sec = cv.parentElement;
    const claro = cv.dataset.costura === 'claro';
    let ultimo = -1;
    const desenha = (forca) => {
      const top = sec.getBoundingClientRect().top;
      const prog = clamp01(1 - top / innerHeight);
      if (prog === ultimo && forca !== true) return;
      ultimo = prog;
      const { ctx, w, h } = ajustaCanvas(cv, 1.5);
      xadrez(ctx, w, h, prog, { celula: w < 900 ? 20 : 26, cor: claro ? cores.piso : cores.noite, acento: '#F2F4F5', partAcento: 0.05 });
    };
    enquantoVisivel(sec, desenha);
    addEventListener('resize', () => desenha(true));
    desenha(true);
  });
}

/* ---------- pilha sticky: o hero recua quando a volta passa por cima ---------- */
function pilha() {
  const camadas = $$('[data-camada]');
  const heroEl = camadas[0];
  const prox = camadas[1];
  const dentro = $('.camada-dentro', heroEl);
  const sombra = $('.camada-sombra', heroEl);
  const fone = matchMedia('(max-width: 639px)');
  const topoSticky = () => { heroEl.style.top = `${Math.min(0, innerHeight - heroEl.offsetHeight)}px`; };
  topoSticky();
  addEventListener('resize', topoSticky);
  const aplica = () => {
    const p = clamp01(1 - prox.getBoundingClientRect().top / innerHeight);
    const encolhe = fone.matches || calmo ? 0 : 0.1;
    dentro.style.transform = p > 0 && encolhe ? `scale(${1 - encolhe * p})` : '';
    sombra.style.opacity = String(0.55 * p);
    dentro.style.visibility = p >= 1 ? 'hidden' : 'visible';
  };
  let pedido = 0;
  addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; aplica(); }); }, { passive: true });
  aplica();
}

/* ---------- nav e ilha ---------- */
function navEIlha() {
  const nav = $('#nav');
  const ilha = $('#ilha');
  let passouHero = false, noFim = false;
  const atualiza = () => {
    nav.classList.toggle('solida', scrollY > 10);
    ilha.classList.toggle('on', passouHero && !noFim);
  };
  new IntersectionObserver(([e]) => { passouHero = !e.isIntersecting && e.boundingClientRect.top < 0; atualiza(); }).observe($('.hero-acoes'));
  new IntersectionObserver(([e]) => { noFim = e.isIntersecting; atualiza(); }).observe($('#fim'));
  addEventListener('scroll', atualiza, { passive: true });
  atualiza();
}

/* ---------- odômetro (Ridgeline) ---------- */
function odometro() {
  $$('[data-odo]').forEach((el) => {
    const final = el.textContent;
    el.setAttribute('aria-label', final);
    el.textContent = '';
    let k = 0;
    const colunas = [];
    [...final].forEach((ch) => {
      if (!/\d/.test(ch)) { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return; }
      const dig = document.createElement('span');
      dig.className = 'dig';
      dig.setAttribute('aria-hidden', 'true');
      const col = document.createElement('span');
      col.innerHTML = Array.from({ length: 20 }, (_, i) => `<i>${i % 10}</i>`).join('');
      col.style.setProperty('--d', `${k++ * 120}ms`);
      dig.appendChild(col);
      el.appendChild(dig);
      colunas.push([col, Number(ch)]);
    });
    quandoEntrar(el, () => colunas.forEach(([col, d]) => { col.style.transform = `translateY(-${(10 + d) * 0.9}em)`; }));
  });
}

/* ---------- faixa que acelera com o scroll (Magic UI scroll-based-velocity) ---------- */
function faixaVeloz() {
  const trilho = $('#faixaTrilho');
  if (!trilho || calmo) return;
  let x = 0, vel = 0, ultimoY = scrollY;
  enquantoVisivel(trilho.parentElement, (t, dt) => {
    const dy = scrollY - ultimoY; ultimoY = scrollY;
    vel += (Math.abs(dy) * 0.9 - vel) * 0.08;
    x -= (0.045 + vel * 0.02) * dt;
    const metade = trilho.scrollWidth / 2;
    if (-x > metade) x += metade;
    trilho.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
  });
}

/* ---------- finalizados: carimbo ao entrar e carta que vira ---------- */
function cartas() {
  const lista = $('#cartas');
  $$('.carta', lista).forEach((carta, i) => {
    carta.style.setProperty('--d', `${(i % 5) * 120}ms`);
    const nome = $('.verso b', carta).textContent;
    carta.setAttribute('aria-label', `${nome}: ver o que foi feito`);
    carta.addEventListener('click', () => carta.setAttribute('aria-pressed', String(carta.getAttribute('aria-pressed') !== 'true')));
    quandoEntrar(carta, () => carta.classList.add('carimbado'), { margem: '0px 0px -12% 0px' });
  });
}

/* ---------- nós dois: o texto se escreve no scroll (Halden / text reveal) ---------- */
function manifesto() {
  const p = $('#nosTexto');
  const pals = emPalavras(p, 'pn');
  if (calmo) { pals.forEach((s) => s.classList.add('lida')); return; }
  enquantoVisivel(p, () => {
    const k = progresso(p, 0.88, 0.62);
    const n = Math.round(k * pals.length);
    pals.forEach((s, i) => s.classList.toggle('lida', i < n));
  });
}

/* ---------- curso: foto em paralaxe e trilho de formação ---------- */
function curso() {
  const foto = $('.curso-foto img');
  const trilho = $('#trilho');
  const itens = $$('li', trilho);
  const quadrados = $$('.marco-q', trilho);
  enquantoVisivel($('#curso'), () => {
    if (!calmo) foto.style.setProperty('--py', `${(-12 + progresso(foto.parentElement) * 10).toFixed(2)}%`);
    const k = calmo ? 1 : progresso(trilho, 0.85, 0.45);
    trilho.style.setProperty('--tp', k.toFixed(3));
    itens.forEach((li, i) => li.classList.toggle('passou', k >= i / (itens.length - 1) - 0.001));
    quadrados.forEach((q) => q.style.setProperty('--tr', `${(k * 450).toFixed(1)}deg`));
  });
}

/* ---------- fim: a marca gigante sobe letra por letra ---------- */
function fim() {
  const m = $('#fimMarca');
  const txt = m.textContent;
  m.textContent = '';
  [...txt].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'le'; s.style.setProperty('--i', i); s.textContent = ch; m.appendChild(s); });
  quandoEntrar(m, () => m.classList.add('dentro'), { margem: '0px 0px -5% 0px' });
}

/* ---------- boot ---------- */
piso($('#pisoFundo'));
textos();
const c = hero();
veu(c.pronta).then(() => entradaHero(c));
costuras();
pilha();
navEIlha();
volta();
pedido();
odometro();
faixaVeloz();
baralho();
cartas();
manifesto();
curso();
fim();
window.__toque = toque;
