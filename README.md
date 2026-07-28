# Dashboard Sumirê — Métricas Orgânicas + Mídia Paga

Dashboard para acompanhar o desempenho orgânico das redes sociais (Instagram + TikTok) e o desempenho de mídia paga (GA4 + Google Ads + Meta Ads) da **Sumirê Perfumaria** e da **Sumirê Exclusivos**, com comparativo mensal (MoM), evolução histórica e destaque dos melhores conteúdos.

## Status

**Em desenvolvimento** — primeira versão funcional montada em 27/07/2026 (Next.js 16 + React 19 + Tailwind v4).

Rodar localmente:
```bash
npm install
npm run dev
# http://localhost:3000
```

Dados reais já plugados: Windsor.ai (Instagram Perfumaria), Google Ads, Meta Ads, Wake Commerce (pedidos).
GA4, Wake CRM e o orgânico das outras 3 contas aparecem como **Indisponível** (nunca como zero/inventado) até as credenciais serem preenchidas em `.env.local`.

## Navegação (5 abas — reorganizado 27/07/2026)

1. **Overview geral** (`/`) — visão cruzada: investimento (Meta+Google) + GA4 + Wake Commerce + MER
2. **Mídia paga** (`/midia-paga`) — sub-abas Visão geral (+ gráfico de investimento diário e donut de mix Meta×Google) / Meta Ads / Google Ads
3. **SEO** (`/seo`) — GA4, com donut de sessões por canal
4. **Ecommerce** (`/ecommerce`) — sub-abas Visão geral (Wake Commerce + Wake CRM + gráfico de receita diária) / Funil (GA4 → pedido Wake)
5. **Orgânico** (`/organico`) — sub-abas Visão geral / Perfumaria Sumirê / Exclusivos Sumirê, cada marca com Instagram/TikTok. Comparativo mensal (com gráfico de barras) e Top conteúdos ficam como cards dentro da Visão geral do Orgânico.

## Design (v2 — 27/07/2026)

Tipografia e densidade adaptadas do dashboard **Positive Co.** (projeto irmão da agência, `Positive-Dashboard-V4`): Poppins (títulos/valores) + DM Sans (corpo), cards com borda fina e barra de status colorida no topo em vez de sombra pesada, micro-labels em caixa alta, tabelas compactas. Cores da Sumirê mantidas (rosa de marca, paleta categórica IG/TikTok, tons de confiabilidade). Logo real da Sumirê no sidebar (`public/sumire-logo.webp`) e favicon (`app/icon.png`), ambos baixados do site oficial da cliente.

Gráficos: Chart.js + react-chartjs-2 (linha, barra, donut) — mesma lib do Positive. Funil é feito com barras HTML/CSS (mais acessível que canvas para essa visualização).

Ainda não implementado: Top conteúdos (bloqueado — Windsor não retorna dado por post, ver a própria tela), telas de CRM/Estoque/Produtos completas do briefing v2.0, banner de meta/pace (não há metas cadastradas ainda — ver briefing v2.0 seção 16, metas não devem ser inferidas automaticamente).

## Escopo (4 contas)

| Marca | Instagram | TikTok |
|---|---|---|
| Sumirê Perfumaria | @perfumariasumire* | @perfumariasumire* |
| Sumirê Exclusivos | @exclusivossumire* | @exclusivossumire* |

\* Handles deduzidos por pesquisa pública — a confirmar pelo operador.

## Escopo — Mídia Paga + E-commerce (adicionado 27/07/2026)

Além do orgânico, o dashboard vai integrar um projeto completo de BI de e-commerce e mídia paga, detalhado no briefing técnico v2.0 do cliente: [`docs/briefing-dashboard-v2.md`](docs/briefing-dashboard-v2.md). **Escopo exclusivo da Sumirê Perfumaria** — a Exclusivos não tem e-commerce próprio nem roda mídia paga, e permanece só no orgânico (Instagram/TikTok) acima.

| Fonte | O que traz |
|---|---|
| GA4 (Google Analytics Data API) | Sessões, conversões, receita, origem/mídia, funil de e-commerce |
| Google Ads | Investimento, cliques, CTR, CPC, conversões, campanhas |
| Meta Ads | Investimento, alcance/impressões pagas, cliques, conversões, campanhas |
| Wake Commerce | Pedidos, itens, status comerciais, receita (captada/aprovada/faturada), estoque, produtos/SKUs |
| Wake CRM | Base de contatos, disparos, automações, receita atribuída por CRM |

O briefing v2.0 define hierarquia de fontes, dicionário de métricas (MER, ROAS, taxas de conversão/aprovação/faturamento etc.), 7 telas (Overview, Mídia Paga, Funil/CRO, CRM, Estoque, Produtos, Qualidade de Dados) e o checklist de perguntas técnicas por fonte que precisa ser respondido antes de iniciar a implementação.

Ver resumo/pendências em [`docs/metricas.md`](docs/metricas.md#8-mídia-paga--e-commerce-adicionado-27072026--fora-do-briefing-original-do-cliente).

## Documentação

- [`docs/briefing.md`](docs/briefing.md) — briefing original do cliente (orgânico, 4 contas)
- [`docs/briefing-dashboard-v2.md`](docs/briefing-dashboard-v2.md) — briefing técnico v2.0 (mídia paga + e-commerce, só Perfumaria)
- [`docs/marca.md`](docs/marca.md) — identidade visual (cores, tipografia, logo)
- [`docs/metricas.md`](docs/metricas.md) — checklist estruturado das métricas pedidas (orgânico + resumo de mídia paga/e-commerce)

## Stack prevista

- **Next.js** (frontend) — versão a definir pelo FORGE
- **Deploy:** Vercel
- **Dados orgânicos:** Instagram via Windsor.ai · TikTok a confirmar
- **Dados de mídia paga/e-commerce:** GA4 Data API · Google Ads API · Meta Marketing API · Wake Commerce API · Wake CRM API (integração direta em cada uma)

## Credenciais / .env

As credenciais de todas as contas (orgânico + mídia paga) ficam em variáveis de ambiente — nunca hardcoded, nunca versionadas.

1. Copie o template: `cp .env.example .env.local`
2. Preencha os valores reais em `.env.local` (ver comentários no `.env.example` sobre onde obter cada credencial)
3. `.env.local` e `.env` são ignorados pelo Git; apenas `.env.example` é versionado

## Próximos passos

1. Operador preenche credenciais reais e confirma os handles das 4 contas (orgânico)
2. Operador preenche credenciais de GA4, Google Ads e Meta Ads em `.env.local` (mídia paga — ver instruções no `.env.example`)
3. Confirmar com a Wake o mecanismo de autenticação da API (Commerce e CRM) e preencher `WAKE_*` no `.env.local`
4. Responder ao checklist de perguntas técnicas por fonte (seção 20 de `docs/briefing-dashboard-v2.md`) antes de iniciar a implementação
5. Obter manual de marca oficial (cores atuais foram inferidas do site — ver `docs/marca.md`)
6. Acionar o FORGE para construir o dashboard
