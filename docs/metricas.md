# Métricas — Checklist para o Dashboard

> Estruturado a partir do briefing (ver `briefing.md`). Serve de checklist quando o FORGE montar o dashboard.
> Escopo: 4 contas (Sumirê Perfumaria + Sumirê Exclusivos) × 2 plataformas (Instagram + TikTok).

## 1. Seguidores
- [ ] Total de seguidores (por conta/plataforma)
- [ ] Crescimento no período (absoluto e %)

## 2. Alcance
- [ ] Alcance no período (contas alcançadas)

## 3. Impressões
- [ ] Impressões no período

## 4. Vídeo
- [ ] Visualizações de vídeo (Reels no Instagram / vídeos no TikTok)

## 5. Engajamento
- [ ] Curtidas
- [ ] Comentários
- [ ] Compartilhamentos
- [ ] Salvamentos
- [ ] **Taxa de engajamento** (métrica calculada)

## 6. Publicações no período
- [ ] Total de publicações realizadas
- [ ] Reels publicados
- [ ] Stories publicados (somente Instagram)

## 7. Perfil / bio
- [ ] Perfil visitado (visitas ao perfil)
- [ ] Cliques no link da bio (quando disponível)

## Visões / cortes exigidos
- [ ] Comparativo mensal (MoM)
- [ ] Evolução histórica das principais métricas
- [ ] Separação por perfil (Perfumaria vs. Exclusivos)
- [ ] Separação por plataforma (Instagram vs. TikTok)
- [ ] Top 5 conteúdos por alcance ou engajamento no período

## Coleta de dados

### Instagram — via Windsor.ai (decidido 10/07/2026)
A coleta de Instagram passou a ser feita pelo conector unificado **Windsor.ai** (`https://connectors.windsor.ai/instagram`), em vez de integrar direto na Meta Graph API. As credenciais ficam em `.env.local` (`WINDSOR_AI_API_KEY` + um `WINDSOR_IG_*_ACCOUNT_ID` por conta) e nunca são versionadas.

**Como rodar a coleta:**
```bash
npm run fetch:instagram
# ou, com outro período:
node --env-file=.env.local scripts/fetch-windsor-instagram.js --date-preset=last_30d
```
- Script: `scripts/fetch-windsor-instagram.js` (Node >= 20.6, `fetch` nativo, sem dependências).
- Saída bruta salva em `data/windsor/instagram-{conta}-{timestamp}.json` (pasta `data/` está no `.gitignore` — são dados de cliente).
- Contas com `account_id` vazio são puladas com aviso (hoje: Sumirê Exclusivos ainda pendente).

**Campos coletados (19):** `date, datasource, account_name, source, followers_count, reach, media_profile_visits, media_reach, likes, comments, media_saved, views, media_engagement, story_interactions, story_views, city, day_of_month, follower_count, website`.

> Teste real (10/07/2026, Sumirê Perfumaria, `last_7d`): 62 registros, todos os 19 campos presentes no schema. Vários campos vêm `null` em registros individuais porque o Windsor devolve linhas quebradas por dimensão (ex.: por dia e por cidade), não um único agregado — a consolidação/limpeza é responsabilidade da camada de dashboard.

### TikTok
Roteamento ainda **não confirmado** pelo operador (pode ser Windsor.ai também ou API direta do TikTok). Blocos legados de credenciais mantidos no `.env.example`.

## 8. Mídia Paga + E-commerce (adicionado 27/07/2026 — fora do briefing original do cliente)

> Escopo ampliado a pedido do operador, agora regido pelo briefing técnico v2.0 completo em [`briefing-dashboard-v2.md`](briefing-dashboard-v2.md): GA4, Google Ads, Meta Ads, **Wake Commerce e Wake CRM** — dicionário de métricas, telas, hierarquia de fontes, tracking, etc.
> **Somente Sumirê Perfumaria** — Sumirê Exclusivos não roda mídia paga nem tem e-commerce próprio no escopo (confirmado pelo operador em 27/07/2026). Exclusivos permanece só nas métricas orgânicas (seções 1-7 acima).
> Esta seção 8 fica como referência resumida; o documento v2.0 é a fonte de verdade para fórmulas, telas e perguntas ao time técnico.

### Pendências (operador precisa preencher)
- Credenciais reais em `.env.local` — ver `.env.example` para instruções de onde obter cada uma (GA4 service account, Google Ads developer token/OAuth, Meta Ads system user token, Wake Commerce/CRM API)
- Confirmar mecanismo de autenticação exato da API da Wake (Commerce e CRM) com o time/documentação Wake
- Responder ao checklist de perguntas por fonte da seção 20 do briefing v2.0 antes de iniciar a implementação

## Notas de disponibilidade por API (validar na implementação)
- **Instagram (Meta Graph API):** cobre a maioria (seguidores, alcance, impressões, engajamento, visitas ao perfil, cliques no link, publicações, stories). Métricas de insights exigem conta Business/Creator e token com escopo adequado. *(Mantido como referência/alternativa — a fonte ativa hoje é o Windsor.ai, ver acima.)*
- **TikTok (TikTok for Developers):** cobertura orgânica mais limitada — visualizações, curtidas, comentários, compartilhamentos e seguidores costumam estar disponíveis; alcance/impressões e "cliques no link da bio" podem não ser expostos. **Não há Stories no TikTok.**
- Marcar como "quando disponível" no dashboard as métricas que a API não retornar, em vez de deixar vazio sem explicação.
