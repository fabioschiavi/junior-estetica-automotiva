// Serviços: acordeão com checklist (Ridgeline) e uma faixa vermelha que corre para o grupo ativo (Halden).
// Cada serviço marcado sai impresso numa ordem de serviço (Kokonut Receipt Printer); "mandar" destaca o papel
// e abre o WhatsApp com a mensagem no formato das legendas do Junior. No celular, a ordem vive na ilha.

import { $, $$, toque } from './motor.js';

const WHATSAPP = '5543998134460';
export const zap = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export function pedido() {
  const form = $('#pedido');
  const grupos = $$('.grupo', form);
  const faixa = $('#faixa');
  const caixaGrupos = $('#grupos');
  const ordem = $('#ordem');
  const papel = $('#papel');
  const linhas = $('#papelLinhas');
  const status = $('#ordemStatus');
  const veiculoTxt = $('#ordemVeiculo');
  const enviar = $('#enviar');
  const enviarTxt = $('#enviarTxt');
  const ilha = $('#ilha');
  const ilhaZap = $('#ilhaZap');
  const ilhaOrdem = $('#ilhaOrdem');
  const ilhaConta = $('#ilhaConta');
  const ilhaTxt = $('#ilhaTxt');
  const ilhaFolha = $('#ilhaFolha');
  const ilhaLinhas = $('#ilhaLinhas');
  const ilhaEnviar = $('#ilhaEnviar');

  /* ---------- faixa que corre ---------- */
  let ativo = grupos.find((g) => g.classList.contains('aberto')) || null;
  const poeFaixa = (g) => {
    grupos.forEach((x) => x.classList.toggle('ativo', x === g));
    if (!g) { faixa.style.opacity = '0'; return; }
    const cab = $('.grupo-cab', g);
    faixa.style.opacity = '1';
    faixa.style.setProperty('--y', `${g.offsetTop + 2}px`);
    faixa.style.setProperty('--h', `${cab.offsetHeight}px`);
  };
  const volta = () => poeFaixa(ativo);
  grupos.forEach((g) => {
    const cab = $('.grupo-cab', g);
    cab.addEventListener('click', () => {
      const abre = !g.classList.contains('aberto');
      g.classList.toggle('aberto', abre);
      cab.setAttribute('aria-expanded', String(abre));
      ativo = abre ? g : grupos.find((x) => x !== g && x.classList.contains('aberto')) || null;
      poeFaixa(ativo);
    });
    if (!toque) {
      cab.addEventListener('pointerenter', () => poeFaixa(g));
      cab.addEventListener('focus', () => poeFaixa(g));
    }
  });
  if (!toque) caixaGrupos.addEventListener('pointerleave', volta);
  addEventListener('resize', volta);
  requestAnimationFrame(volta);

  /* ---------- a ordem ---------- */
  let anteriores = [];
  let timerStatus = 0;
  const monta = () => {
    const marcados = $$('input[name="s"]:checked', form).map((i) => i.value);
    const tipo = $('input[name="tipo"]:checked', form).value;
    const modelo = $('#modelo').value.trim();
    const veiculo = `${tipo}${modelo ? ', ' + modelo : ''}`;

    // contadores de cada grupo
    grupos.forEach((g) => {
      const tot = $$('input[name="s"]', g).length;
      const n = $$('input[name="s"]:checked', g).length;
      $('[data-conta]', g).textContent = `${n} de ${tot}`;
    });

    // linhas novas saem impressas; as desmarcadas somem
    const novos = marcados.filter((m) => !anteriores.includes(m));
    $$('li', linhas).forEach((li) => { if (!marcados.includes(li.dataset.s)) li.remove(); });
    novos.forEach((m) => {
      const li = document.createElement('li');
      li.dataset.s = m;
      li.textContent = m;
      linhas.appendChild(li);
    });
    if (novos.length) {
      papel.classList.remove('avanca'); void papel.offsetWidth; papel.classList.add('avanca');
      ordem.classList.add('imprimindo');
      status.textContent = 'Imprimindo';
      clearTimeout(timerStatus);
      timerStatus = setTimeout(() => { ordem.classList.remove('imprimindo'); status.textContent = 'Pronto'; }, 700);
    } else if (!marcados.length) status.textContent = 'Esperando';
    anteriores = marcados;
    veiculoTxt.textContent = veiculo;

    const msg = marcados.length
      ? `Oi, Junior! Vi o site e quero agendar:\n${marcados.map((m) => '✅ ' + m).join('\n')}\n\nVeículo: ${veiculo}\nQual o melhor dia pra levar?`
      : `Oi, Junior! Vi o site e quero um orçamento.\nVeículo: ${veiculo}`;
    enviar.href = zap(msg);
    enviarTxt.textContent = marcados.length ? 'Destacar e mandar no WhatsApp' : 'Pedir orçamento no WhatsApp';

    // ilha do celular
    const n = marcados.length;
    ilhaZap.hidden = n > 0;
    ilhaOrdem.hidden = n === 0;
    if (n !== Number(ilhaConta.textContent)) { ilhaOrdem.classList.remove('pula'); void ilhaOrdem.offsetWidth; ilhaOrdem.classList.add('pula'); }
    ilhaConta.textContent = n;
    ilhaTxt.textContent = n === 1 ? 'serviço na ordem' : 'serviços na ordem';
    ilhaLinhas.replaceChildren(...marcados.map((m) => Object.assign(document.createElement('li'), { textContent: m })));
    ilhaEnviar.href = zap(msg);
    if (!n) fechaFolha();

    window.__pedido = { marcados, tipo, modelo, msg };
  };
  form.addEventListener('change', monta);
  form.addEventListener('input', monta);

  const destaca = () => {
    papel.classList.remove('avanca', 'destaca'); void papel.offsetWidth; papel.classList.add('destaca');
    setTimeout(() => papel.classList.remove('destaca'), 1300);
  };
  enviar.addEventListener('click', () => { if (anteriores.length) destaca(); });

  /* ---------- folha da ilha ---------- */
  function fechaFolha() { ilhaFolha.hidden = true; ilha.classList.remove('aberta'); ilhaOrdem.setAttribute('aria-expanded', 'false'); }
  ilhaOrdem.addEventListener('click', () => {
    const abre = ilhaFolha.hidden;
    ilhaFolha.hidden = !abre;
    ilha.classList.toggle('aberta', abre);
    ilhaOrdem.setAttribute('aria-expanded', String(abre));
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechaFolha(); });

  monta();
}
