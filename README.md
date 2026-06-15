# Euclides Test

Jogo escolar para o **Dia da Matemática** — ETE Pastor Isaac Martins Rodrigues, Abreu e Lima (PE).

**Equipe:** Plinyl Mateus (dev), Alisson Vinícius, Rikelmy Ferreira, Lucas Barbosa e Marcelo Fernandes.

Hub com minigames matemáticos, pontuação por atividade e **ranking global** (pódio).

## Rodar localmente

```bash
cd /home/mateus/projetos/dia-da-matematica
npm install
npm run dev
```

- Interface: http://localhost:5173  
- API: http://localhost:3001  

Abrir no VS Code: `code-insiders dia-da-matematica.code-workspace`

## Estrutura

| Pacote | Função |
|--------|--------|
| `@ddm/shared` | Catálogo de minigames, regras de pontuação, schemas Zod |
| `@ddm/server` | API REST + SQLite (ranking persistente) |
| `@ddm/client` | Hub web + minigames (Phaser 3) |

## Roadmap (meses)

### Fase 1 — Fundação (atual)
- [x] Monorepo, API, ranking, login por apelido
- [x] Minigame **Operações Rápidas**
- [ ] Deploy na rede da escola (1 PC servidor + tablets/PCs clientes)

### Fase 2 — Mais minigames
- [ ] Quebra-Cabeça de Frações
- [ ] Memória Geométrica
- [ ] Tela de tutorial por minigame

### Fase 3 — Conteúdo avançado
- [ ] Sequência Lógica
- [ ] Gráficos & Coordenadas
- [ ] Modo “revisão” para professores

### Fase 4 — Evento ao vivo
- [ ] Probabilidade na Prática
- [ ] Pódio em tempo real (WebSocket na TV do auditório)
- [ ] Exportar resultados (CSV) para a escola

### Fase 5 — Polimento
- [ ] Arte, sons, acessibilidade
- [ ] Anti-trapaça reforçado
- [ ] Certificado / medalhas virtuais top 3

## Minigames planejados

| ID | Nome | Máx. pts | Fase |
|----|------|----------|------|
| `operacoes-rapidas` | Operações Rápidas | 500 | 1 ✓ |
| `fracoes-puzzle` | Quebra-Cabeça de Frações | 400 | 2 |
| `geometria-memoria` | Memória Geométrica | 350 | 2 |
| `sequencia-logica` | Sequência Lógica | 450 | 3 |
| `graficos-coordenadas` | Gráficos & Coordenadas | 500 | 3 |
| `probabilidade-sorteador` | Probabilidade na Prática | 400 | 4 |

**Total possível no evento:** 2600 pts (cada jogador só ganha a **melhor** pontuação por minigame).

## Banco de dados local

Todos os dados ficam em SQLite:

`data/dia-da-matematica.db`

Tabelas: `jogadores`, `sessoes`, `pontuacoes`, `historico_partidas`, `eventos`, `configuracoes`.

## Dois rankings

| Tipo | Uso | Zera quando |
|------|-----|-------------|
| **Global** | Dia inteiro, soma de todas as apresentações | Professor: *Reset global* no admin |
| **Apresentação** | Cada sessão (projetor → 20 PCs) | *Encerrar apresentação* ou *Reset temporário* |

Pontos de cada partida vão para o **global** sempre. Vão para a **apresentação** só enquanto ela estiver ativa.

## Modo professor (link secreto)

O painel **não aparece no site**. Ao rodar `npm run dev`, o terminal exibe:

```
http://localhost:5173/admin.html
```

Senha padrão: `ddm-escola-2026`.

**Fluxo sugerido:** apresentação no projetor → *Iniciar apresentação* → público nos 20 PCs → *Encerrar e zerar temporário* → ranking global permanece.

## Sair da conta

Botão **Sair** ao lado do apelido (encerra sessão e remove login deste navegador).

## Próximo passo sugerido

Implementar o minigame **Frações** ou configurar o servidor na rede local da escola — diga qual prefere.