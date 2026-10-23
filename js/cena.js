// Hero: um fragment shader em WebGL puro. O piso xadrez do box cobre a foto e QUEIMA de baixo para cima
// com uma frente em brasa (a queima do capacete no Kimi); depois, no desktop, o xadrez volta só onde o cursor
// acabou de passar, com a borda torta de ruído. No celular a queima toca uma vez e a cena para de desenhar.

import { assina, calmo, toque, clamp01 } from './motor.js';

const RASTRO = 24;

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFoto;
uniform vec2 uRes;        // pixels do canvas
uniform float uAsp;       // largura/altura da foto
uniform float uQueima;    // 0 = tudo xadrez, 1 = tudo foto
uniform float uCel;       // lado da casa em pixels do canvas
uniform float uTempo;
uniform float uRitmo;     // velocidade do cursor, suavizada
uniform vec3 uRastro[${RASTRO}];
uniform vec2 uPar;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * ruido(p); p *= 2.03; a *= .5; } return v; }

void main(){
  vec2 px = vUv * uRes;
  // cover com object-position 50% 42% (igual ao <img> por baixo)
  float ca = uRes.x / uRes.y;
  vec2 s = ca > uAsp ? vec2(1., uAsp / ca) : vec2(ca / uAsp, 1.);
  vec2 o = (1. - s) * vec2(.5, .58);
  vec2 uv = vUv * s + o + uPar * s * .012;
  vec3 foto = texture2D(uFoto, uv).rgb;

  // xadrez alinhado pelo topo-esquerdo, como o CSS por baixo
  vec2 c = floor(vec2(px.x, uRes.y - px.y) / uCel);
  float vermelho = mod(c.x + c.y, 2.);
  vec3 piso = mix(vec3(.106, .118, .129), vec3(.784, .086, .114), vermelho);
  // cada casa com um brilho leve de LED de teto, para não ficar chapado
  vec2 dentro = fract(vec2(px.x, uRes.y - px.y) / uCel);
  piso *= .9 + .14 * (1. - dentro.y);

  // a queima: altura (55%) + ruído (45%), frente estreita em brasa
  float n = fbm(px / uRes.y * 5.5 + 3.1);
  float limiar = mix(vUv.y, n, .45);
  float frente = uQueima * 1.3 - .15;
  float inteiro = smoothstep(frente - .02, frente + .02, limiar);
  float brasa = 4. * inteiro * (1. - inteiro);

  // rastro do cursor: cápsulas ao longo das últimas posições, borda torta
  float m = 0.;
  float raio = .085 * uRes.y;
  float torto = ruido(px * .018 + uTempo * .6) - .5;
  for (int i = 0; i < ${RASTRO}; i++) {
    vec3 r = uRastro[i];
    if (r.z <= 0.) continue;
    float d = distance(px, r.xy) + torto * raio * .9;
    m = max(m, r.z * (1. - smoothstep(raio * .55, raio * .62, d)));
  }
  float liga = smoothstep(.06, .21, uRitmo);   // cursor parado não mostra nada
  float aro = clamp(smoothstep(.03, .08, m) - step(.08, m), 0., 1.) * liga;
  m = step(.08, m) * liga;

  float xad = max(inteiro, m);
  vec3 cor = mix(foto, piso, xad);
  cor += vec3(1., .29, .17) * brasa * 1.7;
  cor += vec3(1., .29, .17) * aro;
  gl_FragColor = vec4(cor, 1.);
}`;

export function cena(quadro, foto, canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uFoto', 'uRes', 'uAsp', 'uQueima', 'uCel', 'uTempo', 'uRitmo', 'uRastro', 'uPar'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  const tex = gl.createTexture();
  let dpr = 1;
  let queima = 0;
  let ritmo = 0;
  let rastroLigado = false;
  const rastro = new Float32Array(RASTRO * 3);
  const pts = [];
  const alvo = { x: 0, y: 0, dentro: false };
  const liso = { x: 0, y: 0 };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };

  const medidas = () => {
    dpr = Math.min(devicePixelRatio || 1, toque ? 1.25 : 1.75);
    const w = Math.round(quadro.clientWidth * dpr);
    const h = Math.round(quadro.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };

  const desenha = (t = 0) => {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uAsp, foto.naturalWidth / foto.naturalHeight || 0.75);
    gl.uniform1f(U.uQueima, queima);
    // casas de 7 por linha no celular e 14 no desktop, iguais ao xadrez em CSS que cobre antes
    gl.uniform1f(U.uCel, (innerWidth / (innerWidth < 900 ? 7 : 14)) * dpr);
    gl.uniform1f(U.uTempo, t / 1000);
    gl.uniform1f(U.uRitmo, ritmo);
    gl.uniform3fv(U.uRastro, rastro);
    gl.uniform2f(U.uPar, par.x, par.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const pronta = (foto.complete && foto.naturalWidth ? Promise.resolve() : new Promise((ok) => foto.addEventListener('load', ok, { once: true })))
    .then(() => (foto.decode ? foto.decode().catch(() => {}) : null))
    .then(() => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, foto);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uFoto, 0);
      medidas();
      desenha();
    });

  new ResizeObserver(() => { medidas(); desenha(performance.now()); }).observe(quadro);

  // ---------- a queima ----------
  const queimar = () => new Promise((ok) => {
    if (calmo) { queima = 1; desenha(); ok(); return; }
    const DUR = 2600;
    let t0 = 0;
    const solta = assina((t) => {
      t0 = t0 || t;
      const k = clamp01((t - t0) / DUR);
      queima = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      desenha(t);
      if (k >= 1) { solta(); ok(); if (!toque) ligaRastro(); }
    });
  });

  // ---------- rastro do cursor (só onde há ponteiro de verdade) ----------
  function ligaRastro() {
    if (rastroLigado || calmo) return;
    rastroLigado = true;
    let solta = null;
    const ativa = () => { if (!solta) solta = assina(passo); };
    quadro.addEventListener('pointermove', (e) => {
      const r = quadro.getBoundingClientRect();
      alvo.x = (e.clientX - r.left) * dpr;
      alvo.y = (r.bottom - e.clientY) * dpr;
      par.tx = (e.clientX - r.left) / r.width * 2 - 1;
      par.ty = (r.bottom - e.clientY) / r.height * 2 - 1;
      if (!alvo.dentro) { liso.x = alvo.x; liso.y = alvo.y; }
      alvo.dentro = true;
      ativa();
    });
    quadro.addEventListener('pointerleave', () => { alvo.dentro = false; ativa(); });
    function passo(t) {
      const ax = liso.x, ay = liso.y;
      liso.x += (alvo.x - liso.x) * .35;
      liso.y += (alvo.y - liso.y) * .35;
      const vel = alvo.dentro ? Math.hypot(liso.x - ax, liso.y - ay) / canvas.height : 0;
      const pico = clamp01(vel / .029);
      ritmo += (pico - ritmo) * (pico > ritmo ? .09 : .205);
      par.x += (par.tx - par.x) * .06;
      par.y += (par.ty - par.y) * .06;
      pts.unshift([liso.x, liso.y]);
      if (pts.length > RASTRO) pts.pop();
      for (let i = 0; i < RASTRO; i++) {
        const p = pts[i];
        rastro[i * 3] = p ? p[0] : 0;
        rastro[i * 3 + 1] = p ? p[1] : 0;
        rastro[i * 3 + 2] = p && alvo.dentro ? Math.pow(1 - i / RASTRO, 1.6) : 0;
      }
      desenha(t);
      const parado = ritmo < .002 && Math.abs(par.tx - par.x) < .001 && Math.abs(par.ty - par.y) < .001;
      if (parado) { solta(); solta = null; }
    }
  }

  window.__cena = { get queima() { return queima; }, get ritmo() { return ritmo; } };
  return { pronta, queimar };
}
