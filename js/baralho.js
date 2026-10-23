// Motos: uma pilha de cartas; a de cima vai para o fundo quando você arrasta para o lado (Skiper card swipe).
// Os botões fazem o mesmo, para ninguém depender só do gesto.

import { $, $$, calmo } from './motor.js';

const VISIVEIS = 4;
const LIMIAR = 70;

export function baralho() {
  const pilha = $('#baralho');
  if (!pilha) return;
  const cartas = $$('.moto', pilha);
  const nome = $('#motoNome');
  const conta = $('#motoConta');
  let ordem = cartas.map((_, i) => i);

  const arruma = () => {
    ordem.forEach((idx, pos) => {
      const c = cartas[idx];
      const lado = pos % 2 ? 1 : -1;
      c.style.zIndex = String(cartas.length - pos);
      c.style.setProperty('--x', '0px');
      c.style.setProperty('--y', `${pos * 12}px`);
      c.style.setProperty('--r', `${pos === 0 ? 0 : lado * (2 + pos)}deg`);
      c.style.setProperty('--s', String(1 - pos * 0.045));
      c.style.opacity = pos < VISIVEIS ? '1' : '0';
      c.setAttribute('aria-hidden', String(pos !== 0));
    });
    const topo = cartas[ordem[0]];
    nome.textContent = $('span', topo).textContent;
    conta.textContent = `${cartas.indexOf(topo) + 1} de ${cartas.length}`;
  };

  const joga = (dir) => {
    const topo = cartas[ordem[0]];
    if (calmo) { ordem.push(ordem.shift()); arruma(); return; }
    topo.style.setProperty('--x', `${dir * 130}%`);
    topo.style.setProperty('--r', `${dir * 18}deg`);
    topo.style.opacity = '0';
    setTimeout(() => { ordem.push(ordem.shift()); arruma(); }, 260);
  };
  const volta = () => {
    // a anterior sai do fundo e volta para o topo
    ordem.unshift(ordem.pop());
    const c = cartas[ordem[0]];
    c.style.transition = 'none';
    c.style.setProperty('--x', '-130%');
    c.style.setProperty('--r', '-18deg');
    c.style.opacity = '0';
    void c.offsetWidth;
    c.style.transition = '';
    arruma();
  };

  $('#motoProx').addEventListener('click', () => joga(1));
  $('#motoAnt').addEventListener('click', volta);
  pilha.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') joga(1);
    if (e.key === 'ArrowLeft') volta();
  });

  // arraste com o dedo ou o mouse
  let x0 = 0, y0 = 0, dx = 0, ativo = null, decidido = false, horizontal = false;
  pilha.addEventListener('pointerdown', (e) => {
    ativo = cartas[ordem[0]];
    x0 = e.clientX; y0 = e.clientY; dx = 0; decidido = false; horizontal = false;
  });
  addEventListener('pointermove', (e) => {
    if (!ativo) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!decidido && Math.hypot(mx, my) > 8) { decidido = true; horizontal = Math.abs(mx) > Math.abs(my); if (horizontal) { ativo.classList.add('arrastando'); ativo.setPointerCapture?.(e.pointerId); } }
    if (!horizontal) return;
    dx = mx;
    ativo.style.setProperty('--x', `${dx}px`);
    ativo.style.setProperty('--r', `${dx * 0.06}deg`);
  });
  const solta = () => {
    if (!ativo) return;
    ativo.classList.remove('arrastando');
    if (horizontal && Math.abs(dx) > LIMIAR) joga(Math.sign(dx));
    else if (horizontal) arruma();
    ativo = null;
  };
  addEventListener('pointerup', solta);
  addEventListener('pointercancel', solta);

  pilha.tabIndex = 0;
  arruma();
}
