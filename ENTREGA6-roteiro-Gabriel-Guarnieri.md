# Entrega 6 — Refatorações (Roteiro de Vídeo)
**Integrante:** Gabriel Felipe Guarnieri
**Projeto:** clumsy-bird-utfpr-2026 (fork do Clumsy Bird / melonJS)
**Arquivo principal:** `js/entities/entities.js`

> Quatro refatorações distintas, todas preservando comportamento (refactorings, não
> features). Nenhuma delas é "Rename". Suíte completa: **92 testes verdes**
> (`node --test "test/*.test.js"`), incluindo `test/e6-guarnieri.test.js`.

---

## Resumo das refatorações aplicadas

| # | Padrão (catálogo de Fowler) | Onde | Smell que resolve |
|---|------------------------------|------|-------------------|
| 1 | **Replace Magic Number with Symbolic Constant** | topo de `entities.js` + usos | Números mágicos espalhados |
| 2 | **Extract Method** (`game.isFrozen`) | `entities.js` | Regra de pausa duplicada |
| 3 | **Form Template Method / Pull Up Method** (`Freezable*`) | `entities.js` | Guard de pausa duplicado em 5 `update()` |
| 4 | **Extract Variable** (`screenHeight`) | `PipeGenerator.updateActive` | Consulta repetida / expressão obscura |

---

## ABERTURA (~30s)

**Ação:** Tela inicial do projeto aberta no editor; mostrar a estrutura de pastas e o
arquivo `js/entities/entities.js`. Em seguida abrir um terminal.

**Fala:**
> "Olá, eu sou o Gabriel Felipe Guarnieri. Neste vídeo eu apresento quatro refatorações
> que apliquei no Clumsy Bird, um jogo feito sobre o motor melonJS. Todas as quatro estão
> no arquivo `entities.js`, que concentra as entidades do jogo: o pássaro, os canos, o chão
> e os geradores. São refatorações de verdade — quer dizer, eu mudei a estrutura interna
> do código sem mudar o comportamento do jogo. E pra provar isso, eu tenho uma suíte de
> testes automatizados: são 92 testes, todos passando."

**Ação:** Rodar no terminal:
```bash
node --test "test/*.test.js"
```
Apontar para a linha `# pass 92` / `# fail 0`.

**Fala:**
> "Aqui está: 92 testes passando, zero falhas. Esse é o meu critério de que cada
> refatoração preservou o comportamento. Vamos para a primeira."

---

## REFATORAÇÃO 1 — Replace Magic Number with Symbolic Constant

**Ação:** Mostrar o `git diff` desta parte (ou comparar antes/depois). No "antes",
destacar os literais espalhados: `this.body.gravity = 0.2`, `this.gravityForce += 0.2`,
`currentPos - 72`, `var hitSky = -80`, `new me.Ellipse(12, 10, 60, 40)`,
`settings.height = 1664`, `this.pipeHoleSize = 1240`. No "depois", subir até o topo do
arquivo e mostrar o bloco de constantes nomeadas (`GRAVITY`, `JUMP_IMPULSE`, `CEILING_Y`,
`BIRD_HITBOX`, `PIPE_BODY_HEIGHT`, `PIPE_GAP`).

**Fala — Como funciona a refatoração:**
> "A primeira refatoração é a *Replace Magic Number with Symbolic Constant*, ou seja,
> 'substituir número mágico por constante simbólica'. Número mágico é aquele literal solto
> no meio do código, sem nome, que não explica o que significa. A técnica é simples: você
> cria uma constante com um nome que revela a intenção e troca todas as ocorrências do
> literal por essa constante."

**Fala — A vantagem:**
> "A vantagem é dupla. Primeiro, legibilidade: olhando o código antigo, o que é o `-72`?
> O que é o `0.2`? Agora está escrito `JUMP_IMPULSE` e `GRAVITY`, então o código se
> autoexplica. Segundo, manutenção: a gravidade `0.2` aparecia em quatro lugares
> diferentes. Se eu quisesse deixar o jogo mais pesado, eu teria que caçar os quatro e
> corria o risco de esquecer um, deixando o jogo inconsistente. Agora eu mudo num lugar só."

**Fala — Apresentar o código refatorado:**
> "No topo do `entities.js` eu declarei as constantes: `GRAVITY` igual a `0.2`,
> `JUMP_IMPULSE` igual a `72`, `CEILING_Y` que é o teto da tela em `-80`, o `BIRD_HITBOX`
> com as dimensões da caixa de colisão do pássaro, e as medidas do cano: `PIPE_BODY_HEIGHT`
> e `PIPE_GAP`. E aqui embaixo, no corpo das entidades, cada literal antigo virou uma
> referência a essas constantes — por exemplo, `this.flyTween.to` agora mira em
> `currentPos - JUMP_IMPULSE` em vez de `currentPos - 72`."

---

## REFATORAÇÃO 2 — Extract Method (`game.isFrozen`)

**Ação:** No "antes", mostrar que vários métodos `update()` repetiam exatamente
`if (game.data.paused) { return this._super(...); }`. No "depois", mostrar a função
extraída no topo:
```js
game.isFrozen = function () {
    return !!(game.data && game.data.paused);
};
```

**Fala — Como funciona a refatoração:**
> "A segunda refatoração é *Extract Method*, 'extrair método'. A ideia é pegar um trecho
> de código que tem um propósito claro e dar a ele um nome próprio, isolando-o numa função.
> Aqui eu extraí a *regra de pausa*: a verificação de saber se o jogo está congelado. Antes
> isso era escrito direto como `game.data.paused`, acessando o campo cru em vários pontos.
> Eu transformei essa decisão numa função chamada `isFrozen`."

**Fala — A vantagem:**
> "A vantagem é centralizar uma regra de negócio num único nome. Hoje 'estar congelado'
> é só `game.data.paused`, mas se amanhã a regra ficar mais complexa — por exemplo,
> congelar também durante uma transição de tela — eu mudo só dentro do `isFrozen`, e todo
> mundo que pergunta 'o jogo está congelado?' passa a respeitar a nova regra
> automaticamente. Além disso, o código fica mais legível: `if (game.isFrozen())` se lê
> como uma frase."

**Fala — Apresentar o código refatorado:**
> "Aqui está o método extraído: `game.isFrozen` devolve verdadeiro ou falso conforme o
> `game.data.paused`. O `!!` só garante que o retorno seja sempre booleano. E, como vocês
> vão ver na próxima refatoração, é justamente essa função que passa a ser chamada no lugar
> da verificação duplicada."

---

## REFATORAÇÃO 3 — Form Template Method / Pull Up Method (`Freezable*`)

**Ação:** No "antes", mostrar lado a lado os cinco métodos `update()` —
`BirdEntity`, `PipeEntity`, `PipeGenerator`, `HitEntity` e `Ground` — todos começando com
o mesmo guard de pausa. No "depois", mostrar as classes base
`game.FreezableEntity` e `game.FreezableRenderable`, e como cada entidade passou a
`extend` uma dessas bases e a renomear seu antigo `update()` para `updateActive()`.

**Fala — Como funciona a refatoração:**
> "A terceira é *Form Template Method* combinada com *Pull Up Method*. O Template Method
> funciona assim: você percebe que vários métodos seguem o mesmo esqueleto — aqui, 'se
> estiver congelado, não faça nada; senão, execute a lógica da entidade'. Esse esqueleto
> sobe para uma classe base, que define o método `update` uma única vez, e a parte que
> varia entre as entidades vira um 'gancho' chamado `updateActive`, que cada subclasse
> implementa do seu jeito. O 'subir o método para a base' é o Pull Up Method."

**Fala — A vantagem:**
> "Antes, o mesmo `if (game.data.paused) return this._super(...)` estava copiado em cinco
> `update()` diferentes. Isso é código duplicado clássico: qualquer ajuste na lógica de
> pausa exigia editar cinco lugares — o que a gente chama de *shotgun surgery*. E essa
> duplicação já tinha escondido um bug: o `PipeGenerator` estende `me.Renderable`, mas o
> código duplicado chamava `this._super(me.Entity, ...)`, a classe errada. Ao centralizar
> o guard nas bases, eu elimino a duplicação e corrijo essa divergência de uma vez."

**Fala — Apresentar o código refatorado:**
> "Aqui estão as duas bases. A `FreezableEntity` tem um `update` que pergunta
> `if (game.isFrozen())` — reaproveitando a função da refatoração anterior — e, se não
> estiver congelado, delega para `this.updateActive(dt)`. A `FreezableRenderable` faz o
> mesmo para entidades que herdam de `me.Renderable`. E aqui embaixo: o `BirdEntity` agora
> é `game.FreezableEntity.extend`, e o que antes era `update` virou `updateActive`, já sem
> o `if` de pausa, porque a base cuida disso. Repare que o gerador de canos agora chama
> `this._super(me.Renderable, ...)`, a classe certa — o bug silencioso foi corrigido."

---

## REFATORAÇÃO 4 — Extract Variable (`screenHeight`)

**Ação:** Abrir `PipeGenerator.updateActive`. No "antes", destacar que
`game.viewportHeight()` era chamado duas vezes na geração do par de canos
(`Number.prototype.random(game.viewportHeight() - 100, 200)` e
`posY - game.viewportHeight() - this.pipeHoleSize`). No "depois", mostrar a variável local
`var screenHeight = game.viewportHeight();` e as duas linhas usando `screenHeight`.

**Fala — Como funciona a refatoração:**
> "A quarta refatoração é *Extract Variable*, 'extrair variável'. Quando você tem uma
> expressão repetida, ou um cálculo difícil de ler no meio de uma conta maior, você
> introduz uma variável local com um nome explicativo e passa a usá-la no lugar da
> expressão. Aqui eu extraí a altura da tela, que era consultada duas vezes ao posicionar
> o par de canos."

**Fala — A vantagem:**
> "A vantagem é deixar o cálculo do par de canos explícito: o cano de cima e o cano de
> baixo são posicionados em relação à *mesma* altura de tela, e agora isso está escrito
> com todas as letras numa variável só, `screenHeight`. De quebra, eu evito chamar o mesmo
> getter duas vezes dentro da mesma iteração. Se um dia a forma de obter a altura mudar,
> a leitura acontece num ponto único."

**Fala — Apresentar o código refatorado:**
> "Dentro do `updateActive` do `PipeGenerator`, antes de calcular as posições, eu declaro
> `var screenHeight = game.viewportHeight();`. Aí o `posY`, que é o topo do cano, usa
> `screenHeight - 100`, e o `posY2`, que é o cano de baixo, usa `posY - screenHeight -
> this.pipeHoleSize`. O comportamento é idêntico — tanto que eu escrevi um teste que
> verifica que a distância vertical entre os dois canos continua sendo exatamente a altura
> da tela mais o tamanho do vão."

---

## FECHAMENTO (~30s)

**Ação:** Voltar ao terminal e mostrar `git log --oneline` com o(s) commit(s) da entrega;
opcionalmente rodar os testes de novo (`# pass 92`).

**Fala:**
> "Recapitulando: quatro refatorações distintas, nenhuma delas Rename. *Replace Magic
> Number with Symbolic Constant* para tirar os números mágicos; *Extract Method* para dar
> nome à regra de pausa; *Form Template Method* com *Pull Up Method* para eliminar o guard
> de pausa duplicado em cinco lugares — e ainda corrigir um bug que essa duplicação
> escondia; e *Extract Variable* para deixar o cálculo dos canos mais claro. Tudo
> comprovado pelos 92 testes automatizados. Obrigado!"

---

### Cobertura de testes (`test/e6-guarnieri.test.js`)
- **A — Extract Method:** `isFrozen` segue `game.data.paused`.
- **B — Template/Pull Up:** bases `Freezable` existem; pausado, `updateActive` não roda
  (pássaro, cano, hitbox e chão não se movem); despausado, voltam a se mover.
- **C — Magic Number:** hitbox `12/10/60/40`, pulo de `-72px`, gravidade `+0.2`/tick,
  corpo do cano `1664` e vão `1240`.
- **D — Extract Variable:** o par de canos mantém a distância vertical
  `altura da tela + vão`, independentemente do `posY` aleatório.
