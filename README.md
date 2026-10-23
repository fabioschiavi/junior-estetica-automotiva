# Junior Estética Automotiva — prévia "Bandeirada"

Landing page de prévia para a Junior Estética Automotiva (Rolândia, PR): polimento técnico, vitrificação, polimento de vidros, faróis e higienização, para carro e moto. O piso xadrez vermelho e grafite do box vira a bandeira de chegada, e o "✅ finalizado" que fecha cada post dele é a bandeirada.

Site estático, sem build. Abra por um servidor local (`python -m http.server 4191`) ou pelo GitHub Pages. Feito para o celular primeiro.

## Mecânicas e de onde vieram

| Seção | Mecânica | Referência estudada |
|---|---|---|
| Fundo | `js/piso.js`: um fragment shader com o piso xadrez do box em perspectiva, brilho de LED refletido e névoa; a câmera anda quando a página rola. Só desenha quando algo muda | próprio |
| Véu | A marca JUNIOR enche como medidor (para em 70% até a foto estar pronta); o véu sai desmanchando em xadrez | Kimi (GetLayers) |
| Hero | `js/cena.js`: o xadrez cobre a Ranger e **queima** de baixo para cima com uma frente em brasa (WebGL); no desktop o xadrez volta só onde o cursor acabou de passar. Chamadas digitadas sobre a foto, presas ao ponto certo mesmo com `object-fit: cover` | Kimi + Ridgeline |
| Costura | Bandeira quadriculada se desfazendo entre o hero e a volta, conforme o scroll | Kimi |
| Pilha | O hero fica preso e recua (escala e sombra; só sombra no celular) quando a volta passa por cima | Kimi |
| Uma volta no box | `js/volta.js`: o circuito se enche em uma volta de 6 s, freando nas curvas, e acende as 4 etapas; termina no "Finalizado" | Kimi |
| Serviços | Acordeão com checklist e faixa vermelha que corre até o grupo ativo; chips Carro/Moto | Ridgeline + Halden |
| Ordem de serviço | `js/pedido.js`: cada serviço marcado sai impresso num papel serrilhado; "Destacar e mandar" abre o WhatsApp com a lista no formato das legendas dele | Kokonut UI (Receipt Printer) |
| Ilha (celular) | Pílula fixa que vira "N serviços na ordem" e abre a folha com o envio | Skiper UI (Dynamic island) |
| Números | Odômetro que rola os dígitos; faixa de serviços que acelera com o scroll | Ridgeline + Magic UI |
| Motos | `js/baralho.js`: pilha de cartas que vai para o fundo no arraste (com botões também) | Skiper UI (Card swipe) |
| Finalizados | Cartas com carimbo "✓ finalizado"; o toque vira a carta e mostra o checklist da legenda | Held-mint |
| Nós dois | O texto do post deles se acende palavra por palavra no scroll | Halden |
| Curso | Foto com canto escalonado em paralaxe, trilho de formação com marcador que gira | Kimi |
| Fechamento | Painel com borda vermelha e a marca gigante subindo letra por letra | Kimi + Halden |

## Estrutura

| Arquivo | O quê |
|---|---|
| `index.html` | Conteúdo e seções |
| `css/style.css` | Tokens, base, véu, nav, seções, ilha, responsivo |
| `js/main.js` | Boot e as seções menores (véu, costuras, pilha, nav, odômetro, faixa, cartas, manifesto, curso, fim) |
| `js/motor.js` | Ticker único de rAF, gatilhos de entrada, texto em palavras, desenho da bandeira quadriculada |
| `js/piso.js`, `js/cena.js`, `js/volta.js`, `js/pedido.js`, `js/baralho.js` | Fundo, hero, volta, serviços e ordem, motos |
| `img/fotos/` | Fotos públicas do Instagram @junior_esteticaautomotiva16 em WebP (480 px e original até 1440 px) |
| `img/perfil.webp`, `img/favicon.png` | Foto de perfil (logo) |

## Trocar quando o material oficial chegar

- **Logo vetor**: hoje é a foto de perfil (150 px) na nav e a marca escrita em Archivo itálico largo no véu e no rodapé.
- **Fotos em alta**: mesmos nomes em `img/fotos/` (`<nome>-480.webp` e `<nome>.webp`).
- **Preços**: não há valores no site; o orçamento sai pelo WhatsApp.
- **Endereço e horário**: não estão no Instagram; hoje o site diz só "Rolândia (PR)".
- **Curso**: datas, valor e carga horária da próxima turma.
- **Descrições dos serviços** (uma linha cada) e a lista de formação: confirmar com o Junior.
- **WhatsApp**: `WHATSAPP` em `js/pedido.js` e os links `wa.me` em `index.html` (43 99813-4460).

## Verificação

Playwright em 390×844 e 1440×900: abertura (véu, desmanche, queima), volta completa, ordem impressa com 2 a 3 serviços, ilha, baralho, cartas viradas, sem erros de console. Hooks: `window.__ready` (hero pronto), `__pedido` (mensagem montada), `__volta`.
