# Roteiro de Gravação — Gabriel Guarnieri (CR#7, CR#8, CR#9)

**Projeto:** clumsy-bird-utfpr-2026 (MelonJS 4.0.0) · **Duração-alvo:** ≈5 min
**Jogo rodando em:** http://localhost:8001/ · **Tema:** polimento visual (3 solicitações perfectivas, todas com APIs nativas do MelonJS)

| CR | Efeito | Onde no código | Parâmetros reais |
|----|--------|----------------|------------------|
| #7 | Fade entre estados | `js/game.js` → `loaded()` | `me.state.transition("fade", "#000", 250)` — preto, 250 ms |
| #8 | Pop no score | `js/entities/HUD.js` → `ScoreItem.update`/`draw` | `popScale` 1.6 → 1.0 em **600 ms**, `Quadratic.Out` |
| #9 | Screen shake | `js/entities/entities.js` → `BirdEntity.endAnimation` | `viewport.shake(8, 500, AXIS.BOTH)` antes do `fadeOut("#fff", 100)` |

---

## ✅ Checklist de pré-gravação *(não ler no vídeo)*

- [ ] Build atualizado (`grunt` já rodou) e servidor no ar em http://localhost:8001/.
- [ ] Navegador em tela cheia, zoom 100 %, canvas 900×600 inteiro visível e centralizado.
- [ ] **Gravar a 60 fps.** Os três efeitos são curtos (250 ms / 600 ms / 500 ms); a 30 fps o fade e o shake "somem". Na edição, aplicar **slow-motion 0.5×** nos três momentos.
- [ ] Áudio do jogo ligado — o `hit`/`lose` reforça o impacto do shake. (Tecla **M** alterna mudo.)
- [ ] Treinar **morrer no meio da tela** (bater num cano a meia altura) — o tremor da câmera aparece melhor longe do chão.
- [ ] Ter 2–3 takes de gameplay; escolher a melhor morte na edição.
- [ ] *(Opcional A/B real)* para mostrar o "antes" de fato, abrir um segundo build no commit anterior às features. Caso contrário, **narrar o problema** sobre o gameplay atual — suficiente para a apresentação.

**Controles:** `Espaço` / clique esq. / `↑` / `W` = pular · botão direito = pular · `M` = mudo · `P`/`Esc` = pausa.

---

## 🎬 ABERTURA (~25 s)

**Tela:** menu inicial do jogo.

> "Minhas três solicitações formam um pacote de polimento visual: transições entre telas, feedback de pontuação e reforço de colisão. Todas são perfectivas e usam APIs que já existem no MelonJS 4.0 — então é pouco código novo e bastante ganho de experiência."

---

## 🎬 BLOCO 1 — CR#7 · Fade entre Estados (~70 s)

**Problema (falar):**
> "Antes, a troca entre menu, jogo e game over era um corte seco — a tela trocava de uma frame pra outra, sem transição."

**Ação na tela:**
1. No menu, apertar `Espaço` → a tela **escurece e clareia (fade preto de 250 ms)** ao entrar no jogo. Apontar para a transição.
2. Mais à frente (na morte do pássaro) o mesmo fade leva ao game over; e do game over de volta ao menu. Mostrar que **toda** transição ganhou o efeito.

**Solução (falar):**
> "A solução é uma única linha no `loaded()` do `game.js`: `me.state.transition`, com tipo `fade`, cor preta e 250 milissegundos. O MelonJS guarda essa transição globalmente, então **todas** as mudanças de estado — menu↔jogo↔game over — passam a usar o fade automaticamente, sem eu tocar em cada tela."

**Destaque (falar):**
> "É o caso clássico de baixo esforço e alto ganho visual: uma linha cobre o jogo inteiro."

**Dica de captura:** o fade dura 250 ms — mostrar **duas** transições diferentes (entrar e sair) e dar slow-motion na edição.

---

## 🎬 BLOCO 2 — CR#8 · Pop no Score (~80 s)

**Problema (falar):**
> "A pontuação subia sem nenhum destaque — o número trocava de 0 pra 1, de 1 pra 2, e era fácil nem perceber que pontuou."

**Ação na tela:**
1. Após o "Get Ready" sumir (~2 s), o número grande aparece no **topo-centro** da tela.
2. Passar por 3–4 canos seguidos: a cada ponto o número **incha para 1.6× e volta suavemente** ao tamanho normal.
3. Passar por dois canos bem rápido para mostrar que pontuações em sequência **não acumulam** — cada uma reinicia o pulso limpo.

**Solução (falar):**
> "No `ScoreItem`, dentro do `update`, eu comparo o score atual com o do frame anterior; quando ele incrementa, disparo um `me.Tween` que leva uma escala de 1.6 de volta a 1.0 em 600 milissegundos, com easing `Quadratic.Out` pra desacelerar no fim. No `draw`, eu ancoro a escala no **centro do número** — `save`, `translate` pro centro, `scale`, desenho, `restore` — pra ele pulsar no próprio lugar em vez de ser empurrado pra fora da tela."

**Cuidado (falar):**
> "Dois cuidados. Primeiro, o nome da propriedade é `popScale`, não `scale` — porque `scale` já é um método não-gravável do `me.Renderable`; em ES5 não-estrito a atribuição falharia em silêncio e o tween nunca animaria. Segundo, em pontuações rápidas eu paro o tween anterior antes de começar o novo, então o pulso sempre reinicia limpo."

**Dica de captura:** o número fica em `y ≈ 92`, topo-centro — enquadrar essa região; 600 ms é visível a olho nu, mas slow-motion deixa o pop nítido.

---

## 🎬 BLOCO 3 — CR#9 · Screen Shake (~80 s)

**Problema (falar):**
> "Na colisão existia só vibração háptica — `me.device.vibrate` — que sequer funciona no desktop. Visualmente, o impacto não tinha peso nenhum antes do fade branco."

**Ação na tela:**
1. Bater de propósito num cano, **a meia altura da tela**.
2. No impacto: a tela **treme 8 px nos dois eixos por meio segundo** + um **flash branco** rápido.
3. Esperar ~2 s: o pássaro cai e o **fade do CR#7** leva ao game over — os três efeitos se encadeiam numa morte só.

**Solução (falar):**
> "No `endAnimation` do `BirdEntity`, antes do `fadeOut` branco que já existia, eu chamo `me.game.viewport.shake` com intensidade 8, duração 500 milissegundos, nos dois eixos. É o método de câmera nativo do MelonJS, então não precisei de loop manual nem de mexer na posição das entidades."

**Calibragem (falar):**
> "A intensidade fica em 8 pixels: forte o bastante pra dar impacto, sem deslocar a câmera além dos 900 por 600 do viewport e mostrar borda preta. Um detalhe de robustez: o `updateLayer` do plano de fundo virou um no-op, porque durante o tremor ele recebia coordenadas que geravam `NaN` no fundo."

**Dica de captura:** morrer no meio da tela (não colado no chão) pra a câmera ter espaço pra tremer; gravar 2–3 mortes e escolher a melhor; slow-motion nos 500 ms.

---

## 🎬 ENCERRAMENTO (~20 s)

> "Recapitulando: fade nas transições, pop no score e screen shake na colisão. Três melhorias perfectivas, todas apoiadas em APIs nativas do MelonJS, com pouco código novo e um ganho grande na sensação do jogo. Obrigado!"

---

## ▶️ Sequência sugerida "one-take" (gameplay contínuo)

1. **Menu** → `Espaço` → **fade preto (CR#7)** entra no jogo.
2. "Get Ready" some (~2 s) → passar canos → **pop no score (CR#8)** a cada ponto.
3. Bater num cano no meio da tela → **shake + flash branco (CR#9)**.
4. ~2 s depois → **fade (CR#7)** leva ao **game over**.
5. Avançar → **fade (CR#7)** de volta ao menu — fecha mostrando "todas as transições".

> Uma única partida demonstra os três efeitos na ordem natural; grave 2–3 partidas e escolha a melhor para cada bloco.

---

## ⚠️ Correções aplicadas ao seu rascunho (para a narração bater com o código)

- **CR#7:** a transição é **preta (`#000`) e dura 250 ms** (não genérica "cor/duração").
- **CR#8:** a detecção é **passiva no `update()`** comparando `lastSteps` (não no `draw()`); a escala vai de **1.6 → 1.0 em 600 ms** com `Quadratic.Out` (não 1.5 → 1.0 em 200 ms).
- **CR#8:** o cancelamento de tweens consecutivos é feito **no próprio `update()`** (`scaleTween.stop()`), não em `onDestroyEvent`.
- **CR#8:** a propriedade chama-se **`popScale`** (evita colidir com o método `scale` não-gravável do `me.Renderable`) — vale citar como cuidado técnico.
- **CR#9:** parâmetros reais são **`shake(8, 500, AXIS.BOTH)`**; some o guard `updateLayer` no-op contra `NaN` durante o tremor.
