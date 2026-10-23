// O chão do box atrás da página inteira: um piso xadrez vermelho e grafite em perspectiva, brilhante,
// com o reflexo das barras de LED do teto. A câmera anda para a frente quando a página rola e o reflexo
// segue o cursor. Faz o papel que o feixe de luz fazia na Agulhas: uma atmosfera só, do topo ao rodapé.
// Só desenha quando algo muda (rolagem, ponteiro, tamanho).

import { calmo, toque } from './motor.js';

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uAnda;
uniform vec2 uLuz;
void main(){
  vec2 p = (vUv - vec2(.5, .62)) * vec2(uRes.x / uRes.y, 1.);
  vec3 fundo = vec3(.055, .059, .067);
  if (p.y > -.004) { gl_FragColor = vec4(fundo, 1.); return; }
  // raio da câmera contra o chão
  float z = .42 / -p.y;
  vec2 c = vec2(p.x * z, z + uAnda);
  vec2 casa = floor(c * 1.25);
  float vermelho = mod(casa.x + casa.y, 2.);
  vec3 piso = mix(vec3(.062, .066, .074), vec3(.2, .028, .036), vermelho);
  // junta entre as placas do piso
  vec2 f = fract(c * 1.25);
  float junta = smoothstep(.0, .035, f.x) * smoothstep(.0, .035, f.y) * smoothstep(1., .965, f.x) * smoothstep(1., .965, f.y);
  piso *= .55 + .45 * junta;
  // reflexo das barras de LED: faixas que correm ao longo da profundidade, borradas com a distância
  float barras = 0.;
  for (int i = 0; i < 4; i++) {
    float x = (float(i) - 1.5) * .95 + uLuz.x * .35;
    float d = abs(c.x - x);
    barras += exp(-d * d * (18. / (1. + z * .35)));
  }
  float faixa = .5 + .5 * sin(c.y * 2.2);
  piso += vec3(.78, .83, .9) * barras * (.035 + .05 * faixa) / (1. + z * .25);
  // névoa para o fundo e escurecimento nas bordas
  float nevoa = exp(-z * .26);
  vec3 cor = mix(fundo, piso, nevoa);
  cor *= 1. - .6 * pow(abs(vUv.x - .5) * 1.6, 2.);
  cor = mix(fundo, cor, .82);
  gl_FragColor = vec4(cor, 1.);
}`;

export function piso(canvas) {
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { canvas.remove(); return; }
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(pr, 0, 'p');
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(pr, 'uRes');
  const uAnda = gl.getUniformLocation(pr, 'uAnda');
  const uLuz = gl.getUniformLocation(pr, 'uLuz');

  const escala = toque ? 0.6 : 0.75;   // o piso é borrado de propósito: resolução baixa sai barato
  const luz = { x: 0, y: 0, tx: 0 };
  let anda = 0;
  let pedido = 0;
  const tamanho = () => {
    canvas.width = Math.round(innerWidth * escala);
    canvas.height = Math.round(innerHeight * escala);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const desenha = () => {
    pedido = 0;
    const alvo = scrollY / innerHeight * 1.4;
    anda += (alvo - anda) * (calmo ? 1 : 0.14);
    luz.x += (luz.tx - luz.x) * 0.1;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uAnda, anda);
    gl.uniform2f(uLuz, luz.x, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (Math.abs(alvo - anda) > 0.001 || Math.abs(luz.tx - luz.x) > 0.001) pede();
  };
  const pede = () => { if (!pedido) pedido = requestAnimationFrame(desenha); };
  tamanho();
  desenha();
  addEventListener('resize', () => { tamanho(); pede(); });
  addEventListener('scroll', pede, { passive: true });
  if (!toque) addEventListener('pointermove', (e) => { luz.tx = e.clientX / innerWidth * 2 - 1; pede(); }, { passive: true });
}
