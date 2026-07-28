# Briefing Técnico-Funcional — Projeto de Métricas e Dashboard Sumirê (v2.0)

> Transcrito de `Sumirê Dashboard Briefing.docx` (colocado pelo operador em 27/07/2026).
> **Escopo: exclusivo da Sumirê Perfumaria** — o site perfumariasumire.com.br é o único e-commerce da operação; Sumirê Exclusivos não entra neste briefing (permanece só com as métricas orgânicas de Instagram/TikTok, ver `metricas.md`).
> Este documento substitui o escopo de mídia paga descrito na seção 8 de `metricas.md` como fonte de verdade — `metricas.md` mantém apenas o checklist orgânico (Instagram/TikTok, 4 contas) e passa a referenciar este arquivo para mídia paga/e-commerce.

Objetivo do documento: direcionar o time de tecnologia na validação, especificação e planejamento do dashboard integrado da Sumirê.

## 1. Finalidade deste briefing

Este documento consolida:
- o racional de mensuração definido para o projeto;
- as fontes que deverão compor o dashboard;
- a hierarquia de verdade entre os sistemas;
- as métricas e fórmulas propostas;
- as telas e análises esperadas;
- os cruzamentos necessários;
- as validações técnicas que deverão ser realizadas;
- as perguntas que o time deverá responder;
- os critérios para identificação de impedimentos;
- o formato esperado da devolutiva técnica.

As métricas, conceitos e telas descritos neste documento devem ser tratados como direcionamento funcional do projeto. O objetivo da validação técnica não é reiniciar a definição do dashboard, mas identificar:
- o que pode ser implementado conforme solicitado;
- o que pode ser implementado parcialmente;
- o que depende de ajustes de tracking ou integração;
- o que exige desenvolvimento customizado;
- o que não está disponível nas fontes atuais;
- qual alternativa pode preservar o objetivo de negócio;
- qual deve ser a ordem de desenvolvimento.

Sempre que existir uma limitação, o retorno não deverá se limitar a "a API não disponibiliza". Será necessário informar: qual informação está indisponível; qual é a causa; qual impacto isso gera; se existe fonte alternativa; se existe proxy aceitável; se depende de tracking adicional; se exige armazenamento próprio; esforço estimado; recomendação técnica.

## 2. Contexto atual da Sumirê

O projeto está concentrado no crescimento e amadurecimento do e-commerce próprio da Sumirê, conectando mídia, comportamento, conversão, CRM, catálogo e estoque.

Fluxo de aquisição considerado: **Meta gera descoberta e demanda → Google captura intenção → remarketing recupera usuários → CRM continua a jornada → campanhas sazonais potencializam os resultados → CRO, tracking, produto e estoque sustentam a escala.**

O dashboard deverá ajudar a reduzir decisões isoladas por plataforma e permitir identificar se os resultados estão sendo limitados por: aquisição; qualidade de tráfego; produto; preço; estoque; experiência das páginas; checkout; pagamento; faturamento; tracking; CRM; dependência de determinados canais.

### 2.1 Sistemas envolvidos

Integração obrigatória:
- **Wake Commerce**
- **Wake CRM**
- **Google Analytics 4**
- **Google Ads**
- **Meta Ads**

Quando necessário, também:
- Google Tag Manager
- tracking server-side
- Stape
- Google Merchant Center
- catálogo da Meta
- Microsoft Clarity
- arquivos/tabelas auxiliares de metas e classificações

### 2.2 Pontos já conhecidos do projeto

- operação passou por migração para a Wake;
- existem divergências de mensuração entre GA4 e a plataforma de e-commerce;
- já houve transações registradas no GA4 com receita zerada;
- gargalo de PDP e conversão ainda é relevante;
- tracking server-side está em processo de estruturação;
- existe limitação de volume de requisições no plano atual do servidor;
- base histórica de CRM ainda possui divisões entre sistemas e origens;
- estoque e produtos da Curva A são fundamentais para decisões de mídia;
- dados de mídia não podem ser tratados isoladamente como verdade financeira;
- campanhas podem gerar demanda para produtos com estoque insuficiente;
- identificação de origem, mídia, campanha e produto precisa ser padronizada.

## 3. Objetivo geral do dashboard

Criar uma camada integrada de gestão do e-commerce capaz de responder: quanto foi investido, quanto o site gerou em pedidos, quanto da receita foi captada, quanto foi aprovado, quanto foi efetivamente faturado, quanto foi cancelado/devolvido, eficiência financeira do investimento, quais canais geraram sessões/pedidos/receita, quais campanhas e produtos sustentaram o resultado, onde estão as maiores perdas do funil, quais páginas têm problemas de conversão, contribuição do CRM, quais produtos têm demanda e estoque, quais produtos recebem mídia sem capacidade de venda, nível de confiabilidade do tracking, quais métricas são oficiais/reconciliadas/diagnósticas/proxies.

O dashboard não deve funcionar apenas como relatório de mídia — deve conectar: **investimento → sessão → comportamento → produto → carrinho → checkout → pedido → aprovação → faturamento → recompra.**

## 4. Princípios de mensuração

### 4.1 Cada sistema possui uma função

Nenhuma fonte deverá substituir outra indevidamente.

**Wake Commerce** — principal fonte para: pedidos; itens dos pedidos; status comerciais; receita captada; receita aprovada (quando disponível); receita faturada; descontos; cupons; frete; cancelamentos; devoluções; produtos; SKUs; estoque.

**Wake CRM** — principal fonte para: base de contatos; disparos; entregas; aberturas; cliques; CTOR; bounces; descadastros; automações; réguas; conversões atribuídas; receita atribuída pelo CRM.

**GA4** — principal fonte para: sessões; usuários; origem e mídia; campanhas; landing pages; comportamento; eventos do funil; dispositivos; páginas; produtos visualizados; atribuição analítica.

**Meta Ads e Google Ads** — principais fontes para: investimento; impressões; alcance; frequência; cliques; CTR; CPC; CPM; conversões atribuídas; receita atribuída pelas plataformas; campanhas; anúncios; criativos; públicos; palavras-chave; termos de pesquisa; produtos anunciados.

### 4.2 Separação entre três realidades

1. **Realidade financeira e comercial** — o que ocorreu na operação. Fonte preferencial: Wake Commerce (e sistema fiscal/financeiro quando necessário).
2. **Realidade comportamental e de atribuição** — como usuários/sessões/canais participaram da jornada. Fonte preferencial: GA4.
3. **Realidade atribuída pelas plataformas de mídia** — o que cada plataforma atribui a si própria segundo sua janela/metodologia. Fontes: Meta Ads e Google Ads.

> As receitas atribuídas por Meta, Google e GA4 não deverão ser tratadas automaticamente como faturamento financeiro.

## 5. Classificação das métricas

Toda métrica deve ter classificação de confiabilidade:

- **Oficial** — extraída diretamente da fonte oficial (ex.: investimento Meta/Google Ads, pedidos faturados Wake, estoque disponível Wake).
- **Reconciliada** — criada por cruzamento entre fontes (ex.: pedidos faturados Wake ÷ sessões GA4; receita faturada Wake ÷ investimento total).
- **Diagnóstica** — útil para otimização, mas não representa necessariamente o resultado financeiro consolidado (ex.: ROAS Meta, ROAS Google, receita atribuída por plataforma, compras modeladas).
- **Proxy** — temporária pela indisponibilidade do dado ideal. Todo proxy deve ser identificado como tal.
- **Indisponível** — não pode ser calculada com confiabilidade. Nunca substituir silenciosamente por zero.

## 6. Hierarquia inicial das fontes

| Informação | Fonte principal | Conferência |
|---|---|---|
| Investimento Meta | Meta Ads | Controle financeiro |
| Investimento Google | Google Ads | Controle financeiro |
| Impressões, alcance e cliques | Plataforma de mídia | — |
| Sessões | GA4 | Wake, caso possua métrica equivalente |
| Eventos do funil | GA4 | Logs e tracking |
| Pedidos captados | Wake Commerce | GA4 |
| Pedidos aprovados | Wake Commerce | Gateway ou sistema financeiro |
| Pedidos faturados | Wake Commerce | Sistema fiscal ou financeiro |
| Receita captada | Wake Commerce | GA4 |
| Receita faturada | Wake Commerce | Sistema fiscal ou financeiro |
| Receita por canal | GA4 ou modelo reconciliado | UTMs e Wake |
| Receita atribuída Meta | Meta Ads | GA4 |
| Receita atribuída Google | Google Ads | GA4 |
| Receita de CRM | Wake CRM e GA4 | Wake Commerce |
| Estoque | Wake Commerce | ERP ou controle interno |
| Produtos e SKUs | Wake Commerce | Feeds Meta e Google |
| Margem e CMV | Sistema financeiro ou ERP | Wake |

> O time deverá confirmar ou corrigir essa hierarquia com base na arquitetura real da Sumirê.

## 7. Definições financeiras propostas

O time deverá mapear os status da Wake e informar como cada etapa é identificada.

- **7.1 Receita captada** — valor total dos pedidos criados. Informar: quais status entram; se pendentes entram; se boleto/Pix aguardando entram; se frete faz parte; se descontos já deduzidos.
- **7.2 Receita aprovada** — pedidos com pagamento aprovado. Informar: campo/status de aprovação; data de aprovação; se pode ser revertida; tratamento de chargebacks.
- **7.3 Receita faturada** — pedidos efetivamente faturados/com NF emitida. Informar: status; data; disponibilidade na API; dependência de outro sistema; pedidos parcialmente faturados.
- **7.4 Receita cancelada** — separar cancelamento antes/depois da aprovação e antes/depois do faturamento.
- **7.5 Receita devolvida/reembolsada** — informar se Wake disponibiliza, devolução parcial, data, dependência de ERP/financeiro.
- **7.6 Receita Gross** — valor bruto antes das principais deduções operacionais; definir se inclui descontos/cupons/frete/cancelamentos/devoluções/impostos.
- **7.7 Receita Net** — receita após deduções comerciais/operacionais acordadas; fórmula final a documentar.

> Não deve existir apenas um indicador "faturamento" sem esclarecer se é captado/aprovado/faturado/Gross/Net.

## 8. Dicionário central de métricas

| # | Métrica | Fórmula |
|---|---|---|
| 8.1 | Investimento total | Investimento Meta Ads + Investimento Google Ads |
| 8.2 | Sessões totais | Total de sessões GA4 |
| 8.3 | Sessões de mídia paga | Sessões classificadas como provenientes dos canais pagos (regras padronizadas de source/medium/campanha) |
| 8.4 | Custo por sessão paga | Investimento total ÷ sessões de mídia paga GA4 (não usar total de sessões do site) |
| 8.5 | Investimento por sessão total | Investimento total ÷ total de sessões do site (blended, não é o custo real por sessão paga) |
| 8.6 | Taxa de conversão GA4 | Transações GA4 ÷ sessões GA4 |
| 8.7 | Taxa de conversão comercial captada | Pedidos captados Wake ÷ sessões GA4 |
| 8.8 | Taxa de conversão comercial aprovada | Pedidos aprovados Wake ÷ sessões GA4 |
| 8.9 | Taxa de conversão comercial faturada | Pedidos faturados Wake ÷ sessões GA4 |
| 8.10 | Taxa de conversão Wake | Pedidos Wake ÷ visitas/sessões Wake (só se Wake tiver medida de sessão comparável) |
| 8.11 | Ticket médio GA4 | Receita GA4 ÷ transações GA4 |
| 8.12 | Ticket médio captado Wake | Receita captada ÷ pedidos captados |
| 8.13 | Ticket médio faturado Wake | Receita faturada ÷ pedidos faturados |
| 8.14 | MER Gross | Receita Gross Wake ÷ investimento total em mídia |
| 8.15 | MER Net | Receita Net Wake ÷ investimento total em mídia |
| 8.16 | MER captado | Receita captada Wake ÷ investimento total |
| 8.17 | MER faturado | Receita faturada Wake ÷ investimento total |
| 8.18 | ROAS GA4 | Receita atribuída pelo GA4 ao canal pago ÷ investimento no canal |
| 8.19 | ROAS Meta | Receita atribuída pelo Meta Ads ÷ investimento Meta |
| 8.20 | ROAS Google | Receita atribuída pelo Google Ads ÷ investimento Google |
| 8.21 | Receita por sessão | Receita atribuída/reconciliada ÷ sessões (por canal, campanha, landing page, dispositivo, produto, categoria) |
| 8.22 | Custo por pedido | Investimento ÷ pedidos (versões: GA4, captados, aprovados, faturados Wake) |
| 8.23 | Taxa de aprovação | Pedidos aprovados ÷ pedidos captados |
| 8.24 | Taxa de faturamento | Pedidos faturados ÷ pedidos aprovados |
| 8.25 | Taxa de cancelamento | Pedidos cancelados ÷ pedidos captados ou aprovados (denominador deve ser informado na interface) |

> MER e ROAS não devem ser apresentados como se fossem a mesma metodologia.

## 9. Métricas de qualidade de tracking

- **9.1** Cobertura de pedidos GA4 = Transações GA4 ÷ pedidos comparáveis Wake
- **9.2** Cobertura de receita GA4 = Receita GA4 ÷ receita comparável Wake
- **9.3** Divergência de pedidos = Pedidos Wake − transações GA4
- **9.4** Divergência de receita = Receita Wake − receita GA4
- **9.5** Pedidos sem origem identificada = pedidos sem canal/origem ÷ total
- **9.6** Eventos de compra sem receita = eventos `purchase` sem valor válido ÷ total de `purchase`
- **9.7** Eventos sem identificador de transação = compras sem `transaction_id` ÷ total de compras
- **9.8** Duplicidade de compra = quantidade/percentual de `transaction_id` disparados mais de uma vez
- **9.9** Campanhas sem UTM válida = sessões/pedidos fora da taxonomia ÷ total
- **9.10** Produtos sem SKU compatível = itens com identificador incompatível entre Wake/GA4/Meta/Google ÷ total

## 10. Modelo de atribuição

O dashboard deve manter as metodologias separadas:

**10.1 Visão da sessão do GA4** — analisar source, medium, campaign, content, term, grupo de canais, landing page, dispositivo, localização. A interface deve informar se a dimensão representa: origem da sessão, primeira origem do usuário, origem do evento ou canal atribuído à compra.

**10.2 Visão das plataformas** — Meta Ads e Google Ads mantêm suas próprias conversões, receitas atribuídas, janelas de atribuição e modelos de conversão. São diagnósticos de mídia.

**10.3 Visão reconciliada** — quando possível, associar sessão GA4, campanha, usuário, pedido Wake, itens, receita e produto. Identificadores a avaliar: `transaction_id`, `order_id`, `client_id`, `session_id`, `user_id`, UTMs, `gclid`, `gbraid`, `wbraid`, `fbclid`, `_fbp`, `_fbc`. O time deve informar quais já são capturados, armazenados na Wake, exportáveis, associáveis ao pedido, exigem ajuste de tracking ou não estão disponíveis.

## 11. Arquitetura de telas

### 11.1 Tela — Overview executivo

**Objetivo:** apresentar rapidamente o resultado do e-commerce, sua eficiência e os principais desvios.

**Cards:** receita captada; receita aprovada; receita faturada; receita Gross; receita Net; pedidos captados; pedidos aprovados; pedidos faturados; investimento total; investimento Meta; investimento Google; sessões totais; sessões pagas; custo por sessão paga; taxa de conversão GA4; taxa de conversão comercial; ticket médio GA4; ticket médio Wake; MER Gross; MER Net; MER faturado; taxa de aprovação; taxa de faturamento; taxa de cancelamento; cobertura de tracking.

**Gráficos:** receita captada vs. aprovada vs. faturada; investimento vs. receita Gross vs. receita Net; investimento vs. MER; sessões vs. conversão; pedidos captados vs. faturados; participação das sessões por canal; participação da receita por canal; receita por sessão por canal; ticket médio por canal; taxa de conversão por canal; resumo do funil; alertas de qualidade dos dados.

**Visão por origem e mídia:** tabela/gráfico com canal, source/medium, sessões, participação das sessões, pedidos, taxa de conversão, ticket médio, receita, participação da receita, receita por sessão.

**Comparações obrigatórias:** período anterior; mesmo período do mês anterior; mês atual vs. anterior; meta vs. realizado; acumulado do mês; comparação anual (quando houver histórico confiável).

### 11.2 Tela — Mídia paga

**Objetivo:** decisões de orçamento, canal, campanha, público, criativo e produto.

**Cards:** investimento total; investimento Meta; investimento Google; participação por plataforma; impressões; alcance; cliques; CTR; CPC; CPM; frequência; sessões pagas; pedidos; custo por pedido; receita atribuída GA4/Meta/Google; ROAS GA4/Meta/Google; MER Gross; MER Net.

**Gráficos:** investimento Meta vs. Google; evolução diária do investimento; investimento vs. ROAS; investimento vs. MER; investimento vs. receita Gross e faturada; participação no investimento vs. participação na receita; custo por pedido por plataforma; ROAS por campanha; receita por campanha; investimento por etapa do funil.

**Tabela consolidada de campanhas** — dimensões: plataforma, conta, campanha, objetivo, etapa do funil, aquisição/remarketing, perene/sazonal, data, status. Métricas: investimento, impressões, alcance, frequência, cliques, CTR, CPC, CPM, sessões GA4, conversões da plataforma, pedidos GA4, pedidos Wake (quando reconciliáveis), custo por pedido, receita da plataforma, receita GA4, receita Wake (quando reconciliável), ROAS, MER.

**Detalhamento Meta Ads:** campanha, conjunto, anúncio, criativo, formato, público, posicionamento, alcance, frequência, cliques, CTR, CPC, CPM, visualizações de vídeo, conversões, receita, ROAS.

**Detalhamento Google Ads:** campanha, tipo de campanha, grupo de anúncios, grupo de recursos, palavra-chave, termo de pesquisa, produto, grupo de produtos, impressões, cliques, CTR, CPC, conversões, receita, ROAS, parcela de impressões, perda por orçamento, perda por ranking.

> O time deverá informar quais dimensões estão disponíveis por API e quais têm limitações por tipo de campanha.

### 11.3 Tela — Funil e CRO

**Objetivo:** identificar os principais pontos de perda da experiência de compra.

**Etapas propostas:** sessão; visualização de página; visualização de lista; `view_item`; `add_to_cart`; `view_cart`; `begin_checkout`; `add_shipping_info`; `add_payment_info`; `purchase` GA4; pedido captado/aprovado/faturado Wake. Não deve haver etapas duplicadas por diferença de nomenclatura.

**Métricas:** usuários e sessões em cada etapa; taxa de progressão; taxa de abandono; tempo entre etapas; receita; ticket; taxa de conversão final.

**Segmentações:** canal; source/medium; campanha; dispositivo; navegador; SO; estado; cidade; novo vs. recorrente; landing page; produto; categoria; marca; faixa de preço; cupom.

**PDPs:** maior volume de sessões; maior receita; maior/menor conversão; taxa de adição ao carrinho; receita por sessão; ticket; estoque; velocidade de venda; abandono após visualização. (Respeitar volume mínimo de sessões/visualizações.)

**Landing pages:** sessões; usuários; engajamento; bounce rate; progressão para PDP/carrinho; conversão; receita; receita por sessão.

**Benchmark:** histórico próprio (principal), período anterior, meta interna, benchmark externo documentado (quando aprovado).

### 11.4 Tela — CRM

**Objetivo:** mensurar o CRM como canal de relacionamento, recuperação e recompra.

**Disparos:** campanhas; contatos selecionados; enviados; entregues; bounces; aberturas; taxa de abertura; cliques; CTR; CTOR; descadastros; reclamações; conversões; receita atribuída; receita por disparo/mil envios/destinatário; ticket; tempo até a compra.

**Visões de receita (coexistem):** receita atribuída pelo Wake CRM (metodologia própria); receita atribuída pelo GA4 (origem/mídia da sessão/compra); receita reconciliada com Wake Commerce (quando houver identificadores suficientes).

**Automações:** boas-vindas; primeira compra; carrinho abandonado; abandono de navegação; pós-compra; recompra; winback; reativação; aniversário; campanhas promocionais; demais réguas.

**Base:** total; consentida; entregável; compradores; leads sem compra; novos contatos; contatos inativos; clientes recorrentes; recência/frequência/valor monetário; receita por cliente; LTV (quando histórico confiável). Bases históricas devem ser identificáveis por origem (base antiga vs. contatos do e-commerce atual).

### 11.5 Tela — Estoque

**Objetivo:** conectar mídia, demanda e capacidade de venda.

**Métricas:** estoque físico/disponível/reservado/indisponível; unidades vendidas; receita por SKU; velocidade de venda; cobertura em dias; sell-through; ruptura; estoque crítico; produtos parados; excesso de estoque; data da última venda/entrada; previsão de ruptura (quando possível).

**Cruzamentos:**
- *Estoque vs. mídia:* produtos anunciados sem estoque; investimento em produto com estoque crítico; campanhas direcionando para produto indisponível; estoque alto com baixa exposição; alto tráfego com risco de ruptura.
- *Estoque vs. conversão:* PDPs com tráfego e indisponibilidade; add-to-cart alto com baixa compra; variações indisponíveis; demanda superior à cobertura.

**Recomendação de produtos:** score avaliando estoque, cobertura, vendas, receita, taxa de conversão, ticket, margem, velocidade, sazonalidade, disponibilidade nos catálogos, presença de criativos.

### 11.6 Tela — Produtos, marcas e categorias

**Objetivo:** identificar quais partes do catálogo sustentam ou limitam os resultados.

**Dimensões:** SKU; produto; marca; marca exclusiva/terceira; categoria; subcategoria; Curva A/B/C; faixa de preço; perene/sazonal; anunciado/não anunciado.

**Métricas:** sessões; visualizações; add to cart; pedidos; unidades; receita captada/faturada; ticket; conversão; receita por sessão; desconto; estoque; cobertura; investimento associado; ROAS; MER; margem (quando disponível).

**Análises:** Curva ABC por receita/unidades; tráfego sem venda; venda sem mídia; dependentes de mídia; melhor receita por sessão; marcas exclusivas vs. terceiros; desconto vs. conversão; disponibilidade vs. receita.

### 11.7 Tela — Qualidade de dados e tracking

**Objetivo:** revelar quando os próprios dados não são confiáveis.

**Indicadores:** última atualização por fonte; status de cada integração; dias sem importação; investimento importado vs. plataforma; pedidos/receita GA4 vs. Wake; compras sem valor/moeda/`transaction_id`; duplicidades; produtos sem SKU; divergência de SKU; campanhas sem UTM/UTMs fora do padrão; pedidos sem origem; % eventos browser vs. server-side; deduplicação browser/server; limite de requisições consumido; erros de API; latência por fonte.

**Alertas:** queda anormal de sessões/compras; transações com receita zerada; gasto sem sessões/conversões; campanha sem UTM; produto anunciado sem estoque; aumento de cancelamentos; queda de aprovação; divergência anormal GA4 vs. Wake; fonte sem atualização; crescimento anormal de eventos duplicados.

## 12. Tracking browser, server-side e server-to-server

Arquitetura híbrida a avaliar.

**Eventos comportamentais** (preferencialmente browser): `page_view`, `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`.

**Eventos transacionais** (avaliar server-side/server-to-server): `purchase`, pagamento aprovado, pedido faturado, cancelamento, reembolso, devolução, chargeback.

O time deve informar: arquitetura atual; eventos já implementados e por qual via; lógica de deduplicação; limite mensal de requisições; impacto do volume; eventos prioritários; necessidade de fila; política de reprocessamento; tratamento de pedidos cancelados; possibilidade de retroalimentar Meta, Google Ads e GA4.

## 13. Modelo de dados mínimo esperado

- **Fato de mídia:** data, plataforma, conta, campanha, grupo/conjunto, anúncio/criativo, investimento, impressões, alcance, cliques, conversões, receita atribuída.
- **Fato de sessões e eventos:** data, usuário anonimizado, sessão, source/medium/campaign/content/term, landing page, dispositivo, evento, item, receita.
- **Fato de pedidos:** `order_id`, `transaction_id`, cliente anonimizado, data de criação/aprovação/faturamento, status, receita Gross/Net, desconto, frete, cupom, origem, UTMs, click IDs.
- **Fato de itens:** `order_id`, SKU, produto, marca, categoria, quantidade, preço, desconto, receita, custo (quando disponível).
- **Fato de CRM:** campanha, automação, canal, data, destinatários, entregues, aberturas, cliques, conversões, receita, descadastros, bounces.
- **Snapshot de estoque:** data/hora, SKU, estoque físico, disponível, reservado, preço, custo, status.
- **Dimensões:** calendário, canal, campanha, produto, marca, categoria, cliente anonimizado, dispositivo, geografia, status do pedido, status do estoque.

## 14. Filtros globais

Período; comparação; canal; plataforma; campanha; conjunto/grupo; anúncio/criativo; source/medium; dispositivo; localização; novo vs. recorrente; produto; SKU; marca; categoria; Curva ABC; status de pedido; status de estoque; cupom; CRM vs. não CRM; marca exclusiva vs. terceira.

O filtro de data deve afetar todas as visualizações compatíveis. Cada fonte deve informar: última atualização; timezone; latência esperada; período histórico disponível.

## 15. Governança de nomenclaturas

- **UTMs:** padrão para `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- **Campanhas:** classificação auxiliar — plataforma, canal, etapa do funil, aquisição/remarketing, perene/sazonal, produto, categoria, público, objetivo, responsável, data de início/encerramento.
- **Produtos:** SKU compatível entre Wake, GA4, Google Merchant Center, Google Ads, catálogo Meta, Meta Ads, CRM e estoque. O time deve informar como tratar produtos com identificadores diferentes.

## 16. Metas e informações manuais

Cadastro/importação de: meta de receita, investimento, MER, ROAS, conversão, ticket; orçamento por canal/campanha. Metas não devem ser inferidas automaticamente. Tabela controlada com: métrica, valor, período, data de vigência, responsável, observação, data da alteração.

## 17. Privacidade e LGPD

Anonimização/hash de identificadores; sem exposição desnecessária de e-mail/telefone; controle de acesso; restrição de exportação; separação de acesso ao CRM; tratamento de consentimento; registro da origem da base; possibilidade de exclusão; documentação das informações pessoais utilizadas.

## 18. Escopo inicial recomendado

- **P0 — Fundação:** integração das fontes; dicionário de métricas; mapeamento dos status Wake; taxonomia de canais; padronização de UTMs e SKUs; rotina de atualização; logs; reconciliação básica; qualidade de dados.
- **P1 — MVP:** Overview; Mídia paga; Funil/CRO; Qualidade de dados; visão básica de produtos.
- **P2 — Expansão:** CRM; estoque; produtos/marcas/categorias; reconciliação avançada; alertas; metas.
- **P3 — Inteligência:** previsão de fechamento; pacing de mídia; detecção de anomalias; score de produtos; previsão de ruptura; análises de retenção; LTV; recomendação de distribuição de verba.

## 19. Fora do escopo inicial

Salvo aprovação posterior: consolidação completa de marketplaces; operação financeira completa das lojas físicas; atribuição omnichannel perfeita; margem sem fonte oficial de CMV; previsão avançada sem histórico mínimo; identificação individual de consumidores em telas abertas; automação de decisões de mídia sem validação humana. Marketplaces podem ser integrados futuramente (dependência/participação), mas não devem travar a primeira entrega do e-commerce próprio.

## 20. Perguntas que o time deverá responder

### 20.1 Wake Commerce
Quais APIs disponíveis? Credenciais/permissões necessárias? Histórico disponível? Paginação/limite de requisições? Extração incremental de pedidos? Histórico de alteração de status? Quais status = captado/aprovado/faturado/cancelado/devolvido? Data por status? Pedidos parcialmente faturados? Devolução parcial? Desconto/cupom/frete/impostos disponíveis? Receita Gross/Net nativa? Itens do pedido extraíveis? SKUs consistentes? UTMs e Click IDs armazenados no pedido? `transaction_id`/`order_id` conciliáveis com GA4? Novo vs. recorrente? Estoque físico/disponível/reservado e histórico? Frequência e latência de atualização?

### 20.2 Wake CRM
Quais dados de campanhas/automações extraíveis? Aberturas/cliques/CTOR/bounces/descadastros disponíveis? Receita atribuída, janela e modelo de atribuição? Associação campanha-contato-pedido? Separação de canais? Histórico da base? Origem do contato identificável? Separação base antiga/Bnex/site? Consentimento? Endpoint de réguas? Frequência e limites de extração?

### 20.3 GA4
Qual propriedade? Exportação para BigQuery? Histórico disponível? Eventos de e-commerce ativos e com problemas? `purchase` com valor/moeda/`transaction_id`? Itens com `item_id`/nome/marca/categoria? Duplicidade? Perda de receita em dias específicos? Sessões por source/medium/campaign? Dimensão de atribuição? Consent mode? Perda estimada de tracking? Diferença interface/API/BigQuery? Latência?

### 20.4 Meta Ads
Quais contas integradas? Níveis de detalhe? Criativos extraíveis? Alcance/frequência? Conversões utilizadas e janela de atribuição? Pixel e CAPI ativos? Deduplicação? Identificadores enviados? Associação produto/SKU? Histórico disponível? Limites da API? Frequência recomendada?

### 20.5 Google Ads
Quais contas/MCC? Tipos de campanha ativos? Extração de campanha/grupo/termo/palavra-chave/produto? Métricas de Performance Max? Grupos de recursos? Dados por SKU/Merchant Center? Conversão utilizada, modelo e janela? Enhanced Conversions ativas? Importação de conversões offline? Histórico e frequência de atualização?

### 20.6 Tracking
Quais tags ativas? Quais eventos browser vs. server-side? Server-to-server da Wake? Limite mensal e consumo estimado? Eventos prioritários? Deduplicação? Tratamento de compras canceladas? Envio de aprovação/faturamento? Monitoramento de falhas? Plano de testes/validação?

### 20.7 Infraestrutura
Onde os dados serão armazenados? Data warehouse? Ferramenta de ETL/ELT? Carga incremental? Atualização de dados retroativos? Tratamento de erros? Ambiente de homologação? Ferramenta de visualização? Controle de acesso? Custo estimado? Frequência de atualização por fonte? Período histórico mantido?

## 21. Formato obrigatório da devolutiva técnica

Para cada requisito, preencher: Requisito; Fonte; Status (Disponível/Parcial/Indisponível/Exige ajuste/Exige desenvolvimento); Campo ou endpoint; Granularidade; Histórico; Atualização; Chave de integração; Limitação; Impacto; Alternativa; Dependência; Esforço (Baixo/Médio/Alto); Prioridade (P0-P3); Recomendação.

## 22. Entregáveis esperados do time de tecnologia

Matriz preenchida de disponibilidade; mapa das APIs e credenciais; mapeamento dos status da Wake; dicionário técnico preliminar; arquitetura proposta; modelo de dados; regras de atualização; estratégia de armazenamento e reconciliação; lista de ajustes de tracking; lista de impedimentos e alternativas; escopo recomendado do MVP; estimativa de esforço por fase; ordem de implementação; dependências de cliente/fornecedores; plano de homologação; critérios técnicos de aceite.

## 23. Critérios de aceite do dashboard

Todas as métricas com fonte, fórmula e classificação; status de pedido documentados; receita captada/faturada diferenciadas; MER e ROAS separados; Meta/Google sem receitas somadas como faturamento; filtros consistentes; taxas consolidadas recalculadas; dados indisponíveis nunca como zero; última atualização visível por fonte; divergências GA4 vs. Wake visíveis; campanhas classificadas; UTMs padronizadas; SKUs conciliáveis; alertas de falha ativos; LGPD respeitada; números reconciliados com sistemas nativos.

## 24. Orientação final ao time

O racional de negócio, métricas e telas deste documento representam o direcionamento desejado. A devolutiva técnica deve responder: como implementar; quais campos usar; quais ajustes são necessários; quais limitações existem; qual alternativa preserva o objetivo; qual é o esforço; qual a melhor ordem de execução.

Não é necessário esperar integrações perfeitas para iniciar. Quando uma informação não puder ser entregue: implementar com a fonte oficial disponível; implementar como métrica reconciliada; usar proxy explicitamente identificado; marcar como indisponível; ou criar plano para disponibilização futura.
