# BRIEFING TÉCNICO-FUNCIONAL — IMPROVE DO DASHBOARD SUMIRÊ

**Versão:** 3.0  
**Projeto:** Dashboard integrado de performance, e-commerce, CRM, SEO e orgânico social — Sumirê  
**Base técnica atual:** repositório `Dashboard-Sumire-main` — Next.js 16, React 19, Tailwind v4 e Chart.js  
**Objetivo:** evoluir o dashboard existente, sem reconstruí-lo desnecessariamente, para que ele se torne uma ferramenta confiável de gestão e apresentação nos check-ins com o cliente.

---

## 0. INSTRUÇÃO PRINCIPAL PARA O TIME TECH E PARA A IA

Este documento é a **fonte de verdade atual para o improve do dashboard da Sumirê**.

Ele substitui requisitos conflitantes dos briefings anteriores presentes no repositório, principalmente:

- referências a Receita Gross e Receita Net;
- divisão em captado, aprovado e faturado;
- qualquer regra financeira que não esteja descrita neste documento.

Para a Sumirê, considerar apenas:

- **Captado:** todos os pedidos criados na Wake dentro do período analisado;
- **Faturado:** pedidos efetivamente pagos, conforme os status da Wake que serão mapeados e validados pelo time.

A implementação deve:

1. evoluir o código existente;
2. preservar a identidade visual atual da Sumirê;
3. utilizar dados reais das integrações;
4. nunca substituir dado indisponível por zero;
5. indicar claramente fórmula, origem e atualização das métricas;
6. manter metodologias de atribuição separadas;
7. permitir comparações temporais consistentes;
8. priorizar clareza para apresentação em check-in;
9. apontar impedimentos técnicos acompanhados de alternativa recomendada;
10. passar por `lint` e `build` antes da entrega.

---

# 1. OBJETIVO DE NEGÓCIO

O dashboard deve permitir que Sumirê e V4 respondam, com rapidez e confiabilidade:

1. Quanto foi captado em pedidos?
2. Quanto foi efetivamente faturado?
3. Qual é a taxa de aprovação dos pedidos?
4. Quanto foi investido em mídia?
5. Qual foi a eficiência geral do investimento?
6. Quantas sessões foram geradas e a qual custo?
7. Qual é a taxa de conversão do e-commerce?
8. Qual é o ticket médio?
9. Quais canais, campanhas, produtos, páginas e regiões explicam o resultado?
10. Onde estão os maiores gargalos do funil?
11. O problema está em tráfego, conversão, ticket, produto, estoque, checkout, pagamento ou tracking?
12. Qual é a contribuição do CRM?
13. Como o SEO está evoluindo em tráfego e receita?
14. A operação está no pace necessário para alcançar as metas do mês?
15. Quais ações precisam ser tomadas até o próximo check-in?

O dashboard deve conectar a cadeia:

> investimento → sessões → navegação → produto → carrinho → checkout → pedido captado → pedido faturado → recompra.

---

# 2. CONTEXTO QUE DEVE ORIENTAR A CONSTRUÇÃO

As análises recentes da Sumirê apontam que o dashboard não pode ficar restrito a mídia paga. Ele precisa dar visibilidade principalmente para:

- conversão do e-commerce;
- gargalos de checkout, especialmente em mobile;
- ticket médio e composição dos pedidos;
- mix de produtos e marcas de ticket mais alto;
- média de itens por pedido;
- produtos com investimento e nenhuma venda;
- produtos anunciados sem estoque ou com problemas no Merchant Center;
- receita por canal;
- produtos mais vendidos;
- diferenças entre GA4 e Wake;
- qualidade do tracking browser, server-side e server-to-server;
- dados de Clarity como apoio ao diagnóstico de CRO;
- metas mensais, pace e projeção de fechamento.

O dashboard deve sustentar a conversa de check-in com quatro respostas:

1. **Onde estamos?**
2. **Por que chegamos nesse resultado?**
3. **Qual é o principal gargalo?**
4. **Qual ação será tomada agora?**

---

# 3. ESCOPO DE FONTES

## 3.1 Wake Commerce

Fonte oficial para:

- pedidos captados;
- pedidos faturados;
- receita captada;
- receita faturada;
- status dos pedidos;
- itens dos pedidos;
- SKU;
- produto;
- marca;
- categoria;
- quantidade;
- preço;
- desconto, quando disponível;
- cupom, quando disponível;
- região de entrega;
- estoque, quando disponível.

## 3.2 Google Analytics 4

Fonte de comportamento e atribuição analítica para:

- sessões;
- usuários;
- origem e mídia;
- canal;
- campanha;
- landing page;
- dispositivo;
- localização;
- eventos do funil;
- transações GA4;
- receita GA4;
- receita por canal;
- taxa de conversão por canal;
- ticket médio por canal;
- páginas e produtos.

A receita do GA4 é **diagnóstica**, não a verdade financeira do negócio.

## 3.3 Google Ads

Fonte oficial para:

- investimento;
- impressões;
- cliques;
- CTR;
- CPC;
- CPM;
- conversões da plataforma;
- valor de conversão da plataforma;
- campanhas;
- grupos de anúncios;
- palavras-chave;
- termos de pesquisa;
- grupos de recursos;
- produtos e grupos de produtos, quando disponíveis;
- parcela de impressões e perdas por orçamento/ranking, quando disponíveis.

## 3.4 Meta Ads

Fonte oficial para:

- investimento;
- impressões;
- alcance;
- frequência;
- cliques e cliques no link;
- CTR;
- CPC;
- CPM;
- compras atribuídas;
- receita atribuída;
- campanha;
- conjunto;
- anúncio;
- posicionamento;
- público;
- criativo.

## 3.5 Wake CRM

Fonte oficial para:

- campanhas e disparos;
- automações e réguas;
- enviados;
- entregues;
- aberturas;
- cliques;
- bounces;
- descadastros;
- conversões atribuídas;
- receita atribuída pelo CRM;
- base de contatos, quando disponível.

## 3.6 Google Search Console

Fonte oficial para SEO:

- cliques orgânicos;
- impressões;
- CTR;
- posição média;
- query;
- página;
- dispositivo;
- país;
- data.

## 3.7 Orgânico social

Fontes:

- Windsor.ai, quando validado;
- Meta/Instagram, quando validado;
- TikTok, quando validado.

Deve atender:

- Sumirê Perfumaria — Instagram e TikTok;
- Sumirê Exclusivos — Instagram e TikTok.

## 3.8 Fontes auxiliares

- Google Merchant Center para saúde do feed e produtos reprovados;
- Microsoft Clarity para diagnósticos de CRO;
- tabela interna para metas, classificações de campanha e anotações de check-in;
- GTM, tracking server-side e integrações server-to-server para qualidade da mensuração.

---

# 4. HIERARQUIA DE VERDADE

| Informação | Fonte principal | Uso |
|---|---|---|
| Investimento Meta | Meta Ads | Oficial de mídia |
| Investimento Google | Google Ads | Oficial de mídia |
| Sessões e comportamento | GA4 | Oficial comportamental |
| Pedidos captados | Wake Commerce | Oficial comercial |
| Pedidos faturados | Wake Commerce | Oficial comercial |
| Receita captada | Wake Commerce | Oficial comercial |
| Receita faturada | Wake Commerce | Oficial comercial |
| Receita por canal | GA4 | Atribuição diagnóstica |
| Receita atribuída Meta | Meta Ads | Diagnóstico da plataforma |
| Receita atribuída Google | Google Ads | Diagnóstico da plataforma |
| Engajamento de CRM | Wake CRM | Oficial de CRM |
| Receita atribuída pelo CRM | Wake CRM | Diagnóstico do CRM |
| Receita last click de CRM | GA4 | Diagnóstico de atribuição |
| SEO | Search Console + GA4 Organic Search | Aquisição e resultado orgânico |
| Produtos, itens e regiões de venda | Wake Commerce | Oficial comercial |
| Estoque | Wake/ERP, conforme disponibilidade | Oficial operacional |
| Saúde do feed | Merchant Center | Oficial do feed |

## Regra inegociável

Não somar receita atribuída pelo Meta e pelo Google e tratá-la como faturamento total. Uma mesma venda pode ser atribuída por mais de uma plataforma.

No consolidado de mídia paga:

- mostrar as receitas das plataformas separadamente;
- usar a receita GA4 last click dos canais pagos como visão consolidada de atribuição;
- usar a receita faturada da Wake como verdade comercial da operação.

---

# 5. DEFINIÇÕES FINANCEIRAS DA SUMIRÊ

## 5.1 Pedido captado

Todo pedido criado na Wake no período selecionado.

```text
Pedidos captados = contagem de todos os pedidos criados no período
```

Não utilizar o campo `valido` como definição permanente de captado.

## 5.2 Pedido faturado

Pedido efetivamente pago, conforme os status da Wake que deverão ser mapeados.

```text
Pedidos faturados = contagem dos pedidos captados cujo status esteja no conjunto de status pagos
```

## 5.3 Receita captada

```text
Receita captada = soma do valor total de todos os pedidos captados
```

## 5.4 Receita faturada

```text
Receita faturada = soma do valor total dos pedidos faturados
```

## 5.5 Coorte para comparação

Na visão principal, utilizar coorte por data de criação do pedido:

- pedidos captados no período;
- desses pedidos, quantos estão faturados no momento da atualização.

Isso permite calcular corretamente a taxa de aprovação.

Se a Wake disponibilizar a data do pagamento, poderá existir uma visão secundária chamada **Faturamento por data de pagamento**, mas ela não deve substituir a visão de coorte usada na taxa de aprovação.

## 5.6 Status Wake

Criar uma configuração central, não hardcoded em múltiplos arquivos:

```ts
const WAKE_PAID_STATUS_IDS = [...];
```

A lista deve ser validada pelo time responsável pela Wake.

---

# 6. DICIONÁRIO DE MÉTRICAS E FÓRMULAS

## 6.1 Métricas comerciais

### Pedidos captados

```text
COUNT(pedidos Wake criados no período)
```

### Pedidos faturados

```text
COUNT(pedidos captados com status pago)
```

### Receita captada

```text
SUM(valor total dos pedidos captados)
```

### Receita faturada

```text
SUM(valor total dos pedidos faturados)
```

### Taxa de aprovação

```text
Pedidos faturados ÷ Pedidos captados
```

Apresentar em percentual.

### Gap de aprovação em pedidos

```text
Pedidos captados − Pedidos faturados
```

### Gap de aprovação em receita

```text
Receita captada − Receita faturada
```

### Ticket médio captado

```text
Receita captada ÷ Pedidos captados
```

### Ticket médio faturado

```text
Receita faturada ÷ Pedidos faturados
```

### Itens por pedido

```text
Quantidade total de itens vendidos ÷ Quantidade de pedidos
```

### Itens por pedido acima de R$ 150

```text
Quantidade total de itens em pedidos com valor > R$ 150 ÷ Quantidade de pedidos com valor > R$ 150
```

O corte de R$ 150 deve ser configurável.

---

## 6.2 Métricas de tráfego e aquisição

### Investimento total

```text
Investimento Meta Ads + Investimento Google Ads
```

### Sessões totais

```text
Sessões GA4 no período
```

### Sessões pagas

Sessões GA4 classificadas como provenientes de Meta Ads e Google Ads segundo a tabela de canais e UTMs.

```text
Sessões pagas = SUM(sessions dos canais pagos mapeados)
```

### Custo por sessão paga

```text
Investimento total ÷ Sessões pagas GA4
```

Não dividir o investimento por todas as sessões do site como métrica principal.

### Investimento por sessão total

Métrica blended opcional:

```text
Investimento total ÷ Sessões totais GA4
```

Deve ser identificada como blended.

---

## 6.3 Taxas de conversão

### Taxa de conversão GA4

Usar transações/e-commerce purchases, e não o total genérico de conversões da propriedade.

```text
Transações GA4 ÷ Sessões GA4
```

### Taxa de conversão captada

Métrica reconciliada principal do e-commerce:

```text
Pedidos captados Wake ÷ Sessões GA4
```

### Taxa de conversão faturada

```text
Pedidos faturados Wake ÷ Sessões GA4
```

### Taxa de conversão por canal

```text
Transações GA4 do canal ÷ Sessões GA4 do canal
```

### Exibição de variação de taxas

Para conversão, CTR, aprovação e demais taxas:

- mostrar diferença em pontos percentuais;
- opcionalmente mostrar também variação relativa;
- não apresentar apenas a variação relativa, pois ela pode confundir.

---

## 6.4 Eficiência de mídia

### MER captado

```text
Receita captada Wake ÷ Investimento total
```

### MER faturado

Métrica principal de eficiência comercial:

```text
Receita faturada Wake ÷ Investimento total
```

### ROAS Meta

```text
Receita atribuída pelo Meta ÷ Investimento Meta
```

### ROAS Google

```text
Valor de conversão atribuído pelo Google Ads ÷ Investimento Google
```

### ROAS GA4 por plataforma

```text
Receita GA4 last click mapeada para a plataforma ÷ Investimento da plataforma
```

### ROAS GA4 pago consolidado

```text
Receita GA4 last click de Meta + Google ÷ Investimento total
```

A soma da receita GA4 de Meta e Google é permitida porque utiliza a mesma metodologia de atribuição do GA4. Não confundir com soma das receitas das próprias plataformas.

### Custo por pedido captado

```text
Investimento total ÷ Pedidos captados Wake
```

### Custo por pedido faturado

```text
Investimento total ÷ Pedidos faturados Wake
```

### CTR

```text
Cliques ÷ Impressões
```

No Meta, priorizar cliques no link quando o objetivo for tráfego para o site. Identificar se o CTR exibido é geral ou link CTR.

### CPC

```text
Investimento ÷ Cliques
```

### CPM

```text
Investimento ÷ Impressões × 1.000
```

### Frequência Meta

```text
Impressões ÷ Alcance
```

### CPA da plataforma

```text
Investimento ÷ Compras atribuídas pela plataforma
```

### CPA GA4

```text
Investimento ÷ Transações GA4 atribuídas ao canal/plataforma
```

---

## 6.5 Métricas por canal do GA4

Para cada canal, source/medium e campanha:

- sessões;
- participação das sessões;
- transações;
- taxa de conversão;
- receita GA4;
- participação da receita;
- ticket médio;
- receita por sessão.

### Participação de sessões

```text
Sessões do canal ÷ Sessões totais
```

### Participação de receita

```text
Receita GA4 do canal ÷ Receita GA4 total
```

### Ticket médio do canal

```text
Receita GA4 do canal ÷ Transações GA4 do canal
```

### Receita por sessão

```text
Receita GA4 do canal ÷ Sessões do canal
```

### Índice de eficiência do canal

Opcional:

```text
Participação da receita ÷ Participação das sessões
```

- maior que 1: canal gera mais participação de receita do que de tráfego;
- menor que 1: canal gera menos participação de receita do que de tráfego.

---

## 6.6 Funil de e-commerce

Etapas obrigatórias:

1. Sessão;
2. `view_item`;
3. `add_to_cart`;
4. `view_cart`;
5. `begin_checkout`;
6. `add_shipping_info`;
7. `add_payment_info`;
8. `purchase` GA4;
9. pedido captado Wake;
10. pedido faturado Wake.

### Regra de contagem

Não utilizar `eventCount` bruto como número principal do funil.

O funil deve usar, preferencialmente:

- sessões únicas que contiveram cada evento; ou
- usuários únicos que realizaram cada evento.

Definir um seletor entre **Sessões** e **Usuários**, caso seja tecnicamente possível.

Para um funil sequencial real, avaliar BigQuery ou outra camada que permita respeitar a ordem dos eventos. Enquanto isso não estiver disponível, identificar a versão baseada em sessões com evento como **funil não sequencial**.

### Taxa de progressão

```text
Etapa atual ÷ Etapa anterior
```

### Abandono entre etapas

```text
1 − Taxa de progressão
```

### Conversão final do funil

```text
Purchase ou pedido captado ÷ Sessões
```

---

## 6.7 CRM

### Taxa de entrega

```text
Entregues ÷ Enviados
```

### Taxa de abertura

```text
Aberturas únicas ÷ Entregues
```

### CTR de CRM

```text
Cliques únicos ÷ Entregues
```

### CTOR

```text
Cliques únicos ÷ Aberturas únicas
```

### Taxa de bounce

```text
Bounces ÷ Enviados
```

### Taxa de descadastro

```text
Descadastros ÷ Entregues
```

### Receita por mil envios

```text
Receita atribuída ÷ Enviados × 1.000
```

### Receita por destinatário

```text
Receita atribuída ÷ Enviados
```

### Comparação de receita CRM

Manter lado a lado:

- receita atribuída pelo Wake CRM;
- receita GA4 last click de e-mail, SMS, WhatsApp, push ou demais canais mapeados.

---

## 6.8 SEO

### Cliques, impressões, CTR e posição

Fonte: Google Search Console.

```text
CTR = Cliques ÷ Impressões
```

### Sessões orgânicas

Fonte: GA4 filtrado exclusivamente para Organic Search.

### Taxa de conversão orgânica

```text
Transações GA4 Organic Search ÷ Sessões GA4 Organic Search
```

### Ticket médio orgânico

```text
Receita GA4 Organic Search ÷ Transações GA4 Organic Search
```

### Participação da receita orgânica

```text
Receita GA4 Organic Search ÷ Receita GA4 total
```

### Branded versus non-branded

Criar um dicionário configurável de termos de marca, incluindo variações como:

- sumire;
- sumirê;
- perfumaria sumire;
- demais variações aprovadas.

### Contribuição para o crescimento

```text
Delta de cliques da query/página ÷ Delta total de cliques
```

Usar apenas quando o delta total for positivo e sinalizar corretamente em períodos de queda.

---

# 7. FILTRO DE DATAS E COMPARAÇÕES

## 7.1 Filtro global obrigatório

Remover qualquer dependência fixa de `last_7d`.

Presets:

- Hoje;
- Ontem;
- Últimos 7 dias;
- Últimos 30 dias;
- Mês atual;
- Mês anterior;
- Ano atual;
- Período personalizado.

## 7.2 Comparações

Permitir selecionar:

- período anterior equivalente;
- mesmo intervalo do mês anterior;
- mês anterior fechado;
- mesmo período do ano anterior;
- mesmo mês de 2025;
- sem comparação.

## 7.3 Regras de comparação

- nunca comparar período parcial atual com mês completo anterior sem indicação explícita;
- usar o mesmo número de dias nas comparações equivalentes;
- mostrar as datas exatas do período atual e comparado;
- usar timezone único: `America/Sao_Paulo`;
- todas as fontes devem receber `startDate` e `endDate` explícitos;
- evitar que cada API calcule seu próprio “últimos 7 dias”.

## 7.4 Dia parcial

O dia atual pode distorcer gráficos e comparações.

Implementar:

- toggle **Incluir hoje**;
- padrão recomendado: excluir o dia atual em análises fechadas;
- quando incluído, marcar o ponto como **Dia parcial**;
- no pace mensal, usar dias fechados por padrão.

## 7.5 Granularidade do gráfico

Recomendação:

- até 31 dias: diário;
- de 32 a 120 dias: semanal;
- acima de 120 dias: mensal.

Permitir ajuste manual quando necessário.

---

# 8. ARQUITETURA DE NAVEGAÇÃO PROPOSTA

## Performance

1. Overview;
2. Mídia Paga;
3. SEO;
4. Orgânico Social.

## Commerce

5. E-commerce e Funil;
6. Produtos e Categorias;
7. Estoque e Feed;
8. CRM;
9. Clientes e LTV — evolução futura.

## Gestão

10. Metas e Forecast;
11. Qualidade de Dados;
12. Modo Check-in.

Páginas ainda sem dados reais não devem aparecer como telas vazias na versão apresentada ao cliente. Devem ficar ocultas ou identificadas como beta apenas para usuários internos.

---

# 9. TELA 1 — OVERVIEW EXECUTIVO

## 9.1 Objetivo

Permitir entender a saúde do e-commerce e o andamento do mês em uma única tela.

## 9.2 Header

Exibir:

- período selecionado;
- comparação ativa;
- toggle incluir hoje;
- data e hora da última atualização;
- status resumido das integrações;
- botão atualizar;
- botão modo check-in.

## 9.3 KPIs primários

Primeira linha:

1. Receita faturada;
2. Receita captada;
3. Investimento total;
4. MER faturado;
5. Sessões GA4;
6. Custo por sessão paga;
7. Taxa de conversão captada;
8. Ticket médio faturado.

Segunda linha ou bloco complementar:

- pedidos captados;
- pedidos faturados;
- taxa de aprovação;
- ticket médio captado;
- MER captado;
- taxa de conversão GA4;
- custo por pedido faturado;
- receita GA4 last click paga.

Cada card deve mostrar:

- valor atual;
- comparação selecionada;
- diferença absoluta;
- diferença percentual ou em pontos percentuais;
- meta, quando cadastrada;
- fonte;
- fórmula em tooltip;
- última atualização.

## 9.4 Bloco de metas e pace

Usar bullet charts ou barras de progresso, não velocímetros circulares.

Exibir:

- receita faturada versus meta;
- receita captada versus meta;
- pedidos versus meta;
- investimento versus orçamento;
- MER versus meta;
- conversão versus meta;
- ticket médio versus meta.

Mostrar:

- atingimento;
- pace esperado;
- projeção de fechamento;
- gap;
- média diária necessária.

## 9.5 Gráfico principal

### Receita versus investimento versus MER

Formato recomendado: gráfico combinado.

- barras: investimento;
- linha 1: receita captada;
- linha 2: receita faturada;
- linha 3 ou eixo secundário: MER faturado;
- toggle entre diário, acumulado e média móvel;
- anotações de campanhas, promoções, alterações de site e rupturas.

Não afirmar automaticamente que a receita do dia N é consequência do investimento do dia N−1. Tratar relações de defasagem apenas como análise específica.

## 9.6 Funil macro comparativo

Formato recomendado: funil horizontal ou barras progressivas lado a lado.

Exibir:

- período atual;
- período comparado;
- volume em cada etapa;
- progressão;
- abandono;
- variação.

Filtros rápidos:

- todos;
- mobile;
- desktop;
- canal.

## 9.7 Receita por canal

Substituir o uso exclusivo de donut por uma matriz ordenável.

| Canal | Sessões | % Sessões | Transações | Conversão | Ticket | Receita GA4 | % Receita | Receita por sessão |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

Incluir:

- comparação com período anterior;
- MoM;
- YoY;
- filtros por source/medium e campanha;
- alerta para Unassigned e canais sem padronização.

Um donut compacto pode ser mantido apenas para participação de receita dos principais canais, agrupando cauda longa em “Outros”.

## 9.8 Investimento por plataforma

Formato recomendado:

- barras horizontais Meta versus Google;
- participação no investimento;
- orçamento e pace por plataforma;
- MER/ROAS ao lado de cada barra.

## 9.9 Drivers e riscos

Criar dois cards:

### Principais drivers

- canais que mais adicionaram receita;
- produtos que mais adicionaram receita;
- melhora de conversão;
- melhora de ticket;
- campanhas que mais contribuíram.

### Principais riscos

- queda em etapa do funil;
- baixa taxa de aprovação;
- produto anunciado sem estoque;
- gasto sem vendas;
- GA4 divergente da Wake;
- fonte sem atualização;
- campanha sem UTM;
- anomalia de tracking.

O primeiro MVP pode utilizar regras determinísticas. Inteligência automática avançada fica para uma fase posterior.

---

# 10. TELA 2 — MÍDIA PAGA

## 10.1 Visão consolidada

Cards:

- investimento total;
- investimento Meta;
- investimento Google;
- sessões pagas GA4;
- custo por sessão paga;
- receita GA4 last click paga;
- ROAS GA4 pago;
- MER faturado;
- custo por pedido captado;
- custo por pedido faturado.

## 10.2 Comparação de receitas

Para cada plataforma, exibir lado a lado:

- receita atribuída pela plataforma;
- receita last click GA4;
- diferença absoluta;
- razão plataforma versus GA4;
- receita faturada Wake como contexto geral, sem atribuição direta quando não houver conciliação.

### Consolidado pago

- somar a receita GA4 dos canais mapeados como Meta e Google;
- não somar as receitas atribuídas pelas próprias plataformas como headline oficial.

## 10.3 Gráficos

1. Investimento Meta versus Google;
2. Investimento versus receita GA4 paga;
3. Investimento versus receita faturada Wake;
4. Investimento versus ROAS GA4 e MER;
5. Evolução de custo por sessão;
6. Evolução de custo por pedido;
7. Participação de investimento versus participação de receita GA4.

## 10.4 Tabela consolidada de campanhas

Colunas mínimas:

- plataforma;
- campanha;
- status;
- objetivo;
- etapa do funil;
- investimento;
- impressões;
- alcance, quando disponível;
- frequência, quando disponível;
- cliques;
- CTR;
- CPC;
- CPM;
- sessões GA4;
- compras da plataforma;
- receita da plataforma;
- ROAS da plataforma;
- transações GA4;
- receita GA4;
- ROAS GA4;
- custo por pedido.

Recursos:

- ordenação;
- busca;
- exportação CSV;
- filtros;
- destaque condicional;
- comparação com período anterior;
- expansão da linha para drill-down.

## 10.5 Drill-down Meta

Hierarquia:

> campanha → conjunto → anúncio → criativo.

Métricas:

- investimento;
- alcance;
- impressões;
- frequência;
- cliques no link;
- CTR de link;
- CPC de link;
- CPM;
- visualizações de vídeo;
- compras;
- receita atribuída;
- ROAS;
- sessões GA4;
- receita GA4;
- ROAS GA4.

## 10.6 Drill-down Google

Hierarquia conforme tipo de campanha:

- campanha;
- grupo de anúncios;
- palavra-chave;
- termo de pesquisa;
- grupo de recursos de Performance Max;
- produto/grupo de produtos;
- anúncio/asset, quando disponível.

Métricas adicionais:

- parcela de impressões;
- perda por orçamento;
- perda por ranking;
- qualidade da palavra-chave, quando aplicável;
- status do produto no feed.

## 10.7 Visão de criativos

Formato recomendado: grid de cards com preview e tabela analítica complementar.

Cada criativo deve mostrar:

- thumbnail ou preview;
- nome;
- formato;
- plataforma;
- campanha;
- conjunto/grupo;
- data de início;
- investimento;
- impressões;
- alcance;
- frequência;
- CTR;
- CPC;
- CPM;
- compras;
- receita;
- ROAS;
- comparação;
- alerta de fadiga, quando aplicável.

Aplicar volume mínimo configurável antes de classificar um criativo como melhor ou pior.

## 10.8 Mapeamento GA4 versus plataformas

Criar tabela central de classificação de campanhas e UTMs:

- platform;
- campaign_id;
- campaign_name;
- utm_source;
- utm_medium;
- utm_campaign;
- utm_id, quando possível;
- estágio do funil;
- aquisição ou remarketing;
- perene ou sazonal.

Para novas campanhas, priorizar IDs estáveis em UTMs ou tabela de correspondência. Nomes de campanha podem mudar.

---

# 11. TELA 3 — E-COMMERCE, FUNIL E CRO

## 11.1 Visão comercial

Cards:

- pedidos captados;
- pedidos faturados;
- receita captada;
- receita faturada;
- taxa de aprovação;
- ticket captado;
- ticket faturado;
- itens por pedido;
- gap captado versus faturado.

## 11.2 Gráfico captado versus faturado

Formato recomendado:

- linhas ou barras agrupadas por data de criação do pedido;
- quantidade de pedidos captados e faturados;
- receita captada e faturada;
- taxa de aprovação no eixo secundário ou painel inferior.

## 11.3 Funil completo

Adicionar obrigatoriamente:

- `add_shipping_info`;
- `add_payment_info`.

Fazer double-check técnico dos eventos:

- nome correto;
- disparo único ou repetido;
- valor;
- moeda;
- item_id;
- transaction_id;
- ordem do evento;
- browser versus server-side;
- deduplicação.

## 11.4 Funil por cortes

Permitir:

- canal;
- source/medium;
- campanha;
- mobile versus desktop;
- navegador;
- novo versus recorrente;
- landing page;
- produto;
- categoria;
- região.

Prioridade alta para mobile.

## 11.5 Produtos

Tabelas e rankings:

- produtos com maior receita faturada;
- produtos com maior receita captada;
- produtos com mais unidades;
- produtos com maior ticket;
- produtos com mais sessões/view_item;
- produtos com maior taxa de add to cart;
- produtos com maior taxa de compra;
- produtos com tráfego e nenhuma venda;
- produtos com investimento e nenhuma venda;
- produtos de ticket superior a R$ 150;
- kits;
- produtos por marca e categoria.

### Conversão da PDP

Não atribuir a receita total de uma sessão a todas as páginas visitadas.

Para produto, usar item_id/SKU:

```text
Taxa de compra do produto = sessões com compra do item ÷ sessões com view_item do item
```

```text
Taxa de add to cart do produto = sessões com add_to_cart do item ÷ sessões com view_item do item
```

```text
Receita por visualização do produto = receita do item ÷ sessões com view_item do item
```

Exigir volume mínimo configurável antes de gerar ranking de melhores e piores PDPs.

## 11.6 Landing pages e páginas

Para análise de receita por página, priorizar landing page:

- sessões;
- bounce rate;
- taxa de engajamento;
- transações;
- taxa de conversão;
- receita GA4;
- receita por sessão;
- participação da receita.

Fonte:

- dimensão `landingPagePlusQueryString` ou equivalente;
- métricas de sessão e purchase revenue.

Não atribuir a receita integral a cada página visitada ao longo da sessão.

## 11.7 Regiões

Fonte principal para venda: endereço do pedido Wake.

Mostrar:

- estado;
- cidade;
- pedidos captados;
- pedidos faturados;
- receita captada;
- receita faturada;
- ticket;
- taxa de aprovação;
- participação da receita.

GA4 pode complementar com sessões por região e permitir conversão reconciliada quando tecnicamente possível.

Formato recomendado:

- mapa apenas se estiver legível;
- ranking em barras e tabela como visual principal.

## 11.8 Clarity

Quando houver disponibilidade de dados ou integração:

- páginas com rage clicks;
- páginas com dead clicks;
- scroll depth;
- erros de navegação;
- links para gravações relevantes;
- recorte mobile.

Se não houver API adequada, permitir cadastro manual dos principais insights do Clarity no Modo Check-in.

---

# 12. TELA 4 — PRODUTOS, MARCAS E CATEGORIAS

## Objetivo

Identificar quais partes do catálogo sustentam ou limitam o resultado.

## Dimensões

- SKU;
- produto;
- marca;
- categoria;
- subcategoria;
- faixa de preço;
- kit ou produto unitário;
- anunciado ou não anunciado;
- disponível ou indisponível.

## Métricas

- pedidos;
- unidades;
- receita captada;
- receita faturada;
- ticket;
- itens por pedido;
- sessões/view_item;
- add to cart;
- taxa de compra;
- receita por sessão;
- investimento associado, quando conciliável;
- ROAS GA4;
- estoque.

## Visualizações

1. Curva ABC de receita;
2. ranking de produtos;
3. marca versus receita e ticket;
4. categoria versus receita e conversão;
5. matriz de oportunidade:
   - eixo X: volume de tráfego;
   - eixo Y: taxa de conversão;
   - tamanho: receita;
   - cor: estoque ou faixa de ticket.

## Perguntas que a tela deve responder

- Qual produto explica o aumento do ticket?
- Quais marcas trazem pedidos acima de R$ 150?
- Quais produtos vendem sem mídia?
- Quais produtos consomem mídia e não vendem?
- Quais produtos têm demanda e estão indisponíveis?
- Qual é a média de itens nos pedidos de maior valor?

---

# 13. TELA 5 — ESTOQUE E SAÚDE DO FEED

## 13.1 Wake/ERP

Quando disponível:

- estoque disponível;
- estoque reservado;
- produtos sem estoque;
- estoque crítico;
- velocidade de venda;
- cobertura em dias;
- produtos parados;
- data da última venda.

## 13.2 Merchant Center

- produtos aprovados;
- produtos reprovados;
- links quebrados;
- preço divergente;
- indisponibilidade;
- erros de imagem;
- problemas por SKU.

## 13.3 Cruzamentos

- produto anunciado sem estoque;
- produto com gasto e zero venda;
- produto com alto tráfego e estoque crítico;
- produto com estoque alto e baixa exposição;
- campanha impactada por reprovação de feed.

Formato recomendado: tabela de alertas priorizada por impacto, e não apenas gráficos.

---

# 14. TELA 6 — CRM

## 14.1 Separação obrigatória

Criar uma aba independente para CRM. Não manter CRM apenas como um card dentro de E-commerce.

## 14.2 Visão geral

Cards:

- enviados;
- entregues;
- taxa de entrega;
- taxa de abertura;
- CTR;
- CTOR;
- descadastros;
- receita atribuída Wake CRM;
- receita GA4 last click;
- receita por mil envios.

## 14.3 Campanhas

Tabela:

- campanha;
- canal;
- data;
- público;
- enviados;
- entregues;
- abertura;
- cliques;
- CTR;
- CTOR;
- bounces;
- descadastros;
- conversões;
- receita Wake CRM;
- receita GA4;
- ticket;
- receita por mil envios.

## 14.4 Automações

Separar:

- boas-vindas;
- primeira compra;
- carrinho abandonado;
- abandono de navegação;
- pós-compra;
- recompra;
- winback;
- campanhas promocionais.

## 14.5 Base

Quando disponível:

- total de contatos;
- entregáveis;
- consentidos;
- compradores;
- leads sem compra;
- clientes recorrentes;
- novos contatos;
- inativos;
- recência;
- frequência;
- valor monetário.

## 14.6 Atribuição

Manter as metodologias separadas:

- Wake CRM atribui segundo sua janela;
- GA4 atribui segundo a sessão/canal;
- Wake Commerce é a verdade do pedido.

---

# 15. TELA 7 — SEO

## 15.1 Correção da tela atual

A tela SEO atual não deve trazer todos os canais do GA4.

Ela deve utilizar:

- Google Search Console para visibilidade e cliques de busca;
- GA4 filtrado para Organic Search para sessões, conversão e receita.

## 15.2 KPIs

- cliques;
- impressões;
- CTR;
- posição média;
- sessões orgânicas;
- transações orgânicas;
- taxa de conversão orgânica;
- receita orgânica;
- ticket orgânico;
- participação da receita orgânica.

## 15.3 Visão branded versus non-branded

Mostrar:

- cliques;
- impressões;
- CTR;
- posição;
- participação;
- crescimento;
- contribuição para o crescimento total.

## 15.4 Drivers de crescimento

Formato inspirado no material de referência:

- driver de marca;
- driver de produto/lançamento;
- driver de categoria;
- driver de localidade;
- páginas que mais adicionaram cliques;
- queries que mais adicionaram cliques.

## 15.5 Tabelas

Abas:

1. Crescimento em cliques;
2. Crescimento em impressões;
3. Keywords novas;
4. Keywords perdidas;
5. Páginas;
6. Oportunidades.

Colunas:

- query/página;
- cliques atuais;
- cliques anteriores;
- delta;
- impressões;
- CTR;
- posição;
- sessão GA4, quando conciliável;
- receita GA4, quando conciliável;
- conversão.

## 15.6 Oportunidades SEO

Priorizar:

- alta impressão e baixo CTR;
- posições 4 a 10;
- posições 11 a 20;
- páginas com crescimento de impressão sem crescimento de clique;
- queries novas;
- páginas em queda;
- canibalização;
- URLs duplicadas;
- HTTP/HTTPS ou parâmetros concorrendo.

Formato recomendado:

- tabela priorizada;
- scatter plot de impressões versus CTR, com posição por cor;
- cards de oportunidade com descrição curta.

## 15.7 Cruzamento Search Console + GA4

Conciliar pela URL normalizada:

- página GSC;
- landing page GA4.

Mostrar:

- cliques GSC;
- sessões GA4;
- transações;
- receita;
- conversão;
- receita por clique;
- receita por sessão.

Documentar que cliques e sessões não serão idênticos por diferenças de metodologia, consentimento e navegação.

---

# 16. TELA 8 — ORGÂNICO SOCIAL

## 16.1 Correção prioritária

Revisar e validar as credenciais ainda não confirmadas.

O código atual possui:

- Instagram Perfumaria com integração já iniciada;
- demais contas ainda pendentes ou com handles inferidos;
- TikTok sem rota de coleta confirmada;
- dados por post limitados na integração atual.

Não exibir zero quando uma credencial não estiver validada.

## 16.2 Contas

- Perfumaria — Instagram;
- Perfumaria — TikTok;
- Exclusivos — Instagram;
- Exclusivos — TikTok.

## 16.3 Métricas

- seguidores;
- crescimento;
- alcance;
- impressões;
- visualizações de vídeo;
- curtidas;
- comentários;
- compartilhamentos;
- salvamentos;
- engajamento;
- visitas ao perfil;
- cliques na bio;
- quantidade de publicações;
- frequência de publicação.

### Taxa de engajamento recomendada

Quando houver alcance:

```text
Interações ÷ Alcance
```

Caso a fonte só permita seguidores:

```text
Interações ÷ Seguidores
```

Identificar qual metodologia está sendo usada.

## 16.4 Visualizações

- evolução diária/semanal;
- comparação MoM;
- Instagram versus TikTok;
- Perfumaria versus Exclusivos;
- frequência de publicação versus alcance/engajamento;
- top conteúdos, apenas quando o dado por post estiver disponível.

---

# 17. TELA 9 — METAS E FORECAST

## 17.1 Cadastro de metas

Criar tela para cadastrar metas mensais.

Campos:

- mês de referência;
- receita captada;
- receita faturada;
- pedidos captados;
- pedidos faturados;
- sessões;
- taxa de conversão;
- ticket médio;
- investimento total;
- orçamento Meta;
- orçamento Google;
- MER;
- ROAS por canal, quando aplicável;
- custo por sessão;
- observação;
- responsável;
- data da última alteração.

As metas não devem ser inferidas automaticamente.

## 17.2 Métricas de pace para volume

### Atingimento

```text
Realizado ÷ Meta mensal
```

### Percentual do mês transcorrido

```text
Dias fechados transcorridos ÷ Total de dias do mês
```

### Esperado até a data

```text
Meta mensal × Percentual do mês transcorrido
```

### Índice de pace

```text
Realizado ÷ Esperado até a data
```

### Projeção linear

```text
Realizado ÷ Percentual do mês transcorrido
```

### Gap

```text
Meta mensal − Realizado
```

### Necessário por dia

```text
Gap ÷ Dias restantes
```

## 17.3 Métricas de eficiência

Conversão, ticket, MER, ROAS e custo por sessão não devem usar pace linear de volume.

Mostrar:

- valor atual;
- meta;
- diferença absoluta;
- diferença percentual;
- status acima, em linha ou abaixo.

## 17.4 Pace por canal

- investimento Meta versus orçamento Meta;
- investimento Google versus orçamento Google;
- receita GA4 por canal;
- ROAS por canal;
- CPA por canal;
- pace de verba;
- projeção de gasto.

## 17.5 Forecast por alavancas

Criar visão de cenários:

```text
Receita captada projetada = Sessões projetadas × Conversão captada × Ticket captado
```

```text
Receita faturada projetada = Receita captada projetada × Taxa de aprovação
```

Cenários:

- atual;
- base;
- meta.

A projeção linear deve ser identificada como projeção, não como garantia.

---

# 18. TELA 10 — QUALIDADE DE DADOS

## 18.1 Objetivo

Evitar que o dashboard apresente números visualmente convincentes, mas tecnicamente inconsistentes.

## 18.2 Status de fontes

Para cada integração:

- conectado;
- não configurado;
- credencial expirada;
- erro de API;
- atualização atrasada;
- dados parciais;
- última atualização;
- período disponível.

## 18.3 Reconciliação

- pedidos GA4 versus pedidos Wake;
- receita GA4 versus receita Wake;
- compras sem valor;
- compras sem moeda;
- compras sem transaction_id;
- transaction_id duplicado;
- pedidos sem origem;
- campanhas sem UTM;
- source/medium não mapeado;
- Unassigned;
- SKU divergente;
- produto anunciado sem estoque;
- consumo do limite server-side.

### Cobertura de pedidos GA4

```text
Transações GA4 ÷ Pedidos captados Wake
```

### Cobertura de receita GA4

```text
Receita GA4 ÷ Receita captada Wake
```

As métricas devem ser comparadas usando a mesma janela e definição de pedido.

## 18.4 Alertas

- queda anormal de sessões;
- queda anormal de compras;
- purchase com receita zerada;
- gasto sem sessões;
- gasto sem compra;
- campanha sem UTM;
- fonte sem atualização;
- aumento de divergência GA4 versus Wake;
- produto anunciado sem estoque;
- erro no Merchant Center;
- crescimento de eventos duplicados.

---

# 19. MODO CHECK-IN

Criar uma visão específica para apresentação ao cliente.

## Estrutura

1. Resultado versus meta;
2. principais drivers;
3. principais gargalos;
4. ações realizadas desde o último check-in;
5. próximas ações;
6. responsáveis;
7. prazos;
8. dependências do cliente;
9. decisões necessárias.

## Bloco de ações

Permitir cadastro manual:

| Tema | Diagnóstico | Ação | Responsável | Prazo | Status |
|---|---|---|---|---|---|

## Anotações em gráficos

Permitir registrar eventos como:

- campanha lançada;
- mudança de orçamento;
- início de promoção;
- alteração de frete;
- ajuste de checkout;
- ruptura de produto;
- correção de tracking.

Essas anotações devem aparecer no gráfico de receita e investimento.

---

# 20. REGRAS DE VISUALIZAÇÃO

## 20.1 Cards

Usar cards para KPIs resumidos, sempre com:

- valor;
- comparação;
- fonte;
- fórmula;
- atualização;
- meta, quando aplicável.

## 20.2 Linhas

Usar para:

- evolução temporal;
- receita;
- conversão;
- ticket;
- MER;
- SEO;
- métricas de orgânico.

## 20.3 Barras

Usar para:

- comparação de canais;
- plataforma;
- produtos;
- marcas;
- regiões;
- metas versus realizado.

## 20.4 Gráfico combinado

Usar para:

- investimento versus receita versus MER;
- volume versus eficiência.

Sempre diferenciar eixos e unidades.

## 20.5 Donut

Utilizar apenas quando houver poucas categorias e o objetivo for participação.

Evitar donut para listas extensas de canais. Agrupar cauda longa em “Outros”.

## 20.6 Tabelas

Usar como principal visual para análises que exigem comparação e decisão:

- campanhas;
- criativos;
- produtos;
- páginas;
- queries;
- regiões;
- CRM;
- alertas.

## 20.7 Mapas

Usar somente como complemento. Ranking em barras/tabela deve ser o principal para regiões.

## 20.8 Cores

Manter a identidade Sumirê e criar cores semânticas consistentes:

- captado;
- faturado;
- investimento;
- GA4;
- Meta;
- Google;
- positivo;
- atenção;
- erro.

Nunca depender apenas da cor. Incluir texto ou ícone.

## 20.9 Legibilidade

- aumentar contraste de textos secundários;
- manter fonte legível em projeção;
- tooltips objetivos;
- unidades claras;
- moeda em BRL;
- percentuais com casas decimais consistentes;
- permitir tela cheia nos gráficos principais.

## 20.10 Amostras pequenas

Rankings de melhores e piores devem possuir volume mínimo configurável de:

- sessões;
- investimento;
- impressões;
- pedidos.

Não classificar outliers de baixa amostragem como vencedores.

---

# 21. FILTROS GLOBAIS E LOCAIS

## Globais

- período;
- comparação;
- incluir hoje;
- dispositivo;
- canal;
- source/medium;
- campanha;
- região.

## Locais, conforme a tela

- plataforma;
- campanha;
- conjunto/grupo;
- anúncio/criativo;
- palavra-chave;
- termo de pesquisa;
- produto;
- SKU;
- marca;
- categoria;
- status do pedido;
- status de estoque;
- canal de CRM;
- branded/non-branded.

Os filtros devem afetar apenas visualizações compatíveis e indicar quando determinado cruzamento não está disponível.

---

# 22. REQUISITOS TÉCNICOS PARA A CAMADA DE DADOS

## 22.1 Objeto central de período

Refatorar as funções para receber datas explícitas:

```ts
interface DateRange {
  startDate: string;
  endDate: string;
  timezone: 'America/Sao_Paulo';
  includeToday: boolean;
}
```

Evitar funções limitadas a:

```ts
getSummary('last_7d')
```

Preferir:

```ts
getSummary(dateRange)
```

## 22.2 Comparação centralizada

```ts
type ComparisonMode =
  | 'previous_period'
  | 'previous_month_equivalent'
  | 'previous_month_full'
  | 'previous_year_equivalent'
  | 'same_month_2025'
  | 'none';
```

A aplicação deve calcular as datas uma única vez e enviar os mesmos intervalos para todas as fontes.

## 22.3 Definição de métrica

Criar um dicionário central:

```ts
interface MetricDefinition {
  id: string;
  label: string;
  formula: string;
  source: string;
  classification: 'oficial' | 'reconciliada' | 'diagnostica' | 'indisponivel';
  format: 'currency' | 'integer' | 'percentage' | 'decimal';
}
```

## 22.4 Dados indisponíveis

- não retornar zero por ausência de credencial;
- retornar status e motivo;
- informar qual configuração falta;
- ocultar cálculos derivados quando o denominador ou fonte não existir.

## 22.5 Atualização e cache

- exibir última atualização por fonte;
- respeitar limites das APIs;
- utilizar cache controlado;
- botão atualizar não deve disparar chamadas excessivas sem proteção;
- registrar erros de coleta.

## 22.6 Normalização

Criar dimensões comuns:

- data;
- canal;
- plataforma;
- campanha;
- produto;
- SKU;
- região;
- status do pedido.

## 22.7 Identificadores

Avaliar e armazenar, quando disponíveis:

- order_id;
- transaction_id;
- item_id/SKU;
- campaign_id;
- adset/adgroup_id;
- ad/creative_id;
- client_id;
- session_id;
- UTMs;
- gclid;
- gbraid;
- wbraid;
- fbclid;
- _fbp;
- _fbc.

---

# 23. CORREÇÕES OBRIGATÓRIAS NO CÓDIGO ATUAL

## 23.1 Período hardcoded

Situação atual:

- GA4, Google Ads, Meta Ads e Wake utilizam últimos 7 dias por padrão;
- textos da interface também exibem “últimos 7 dias”.

Correção:

- criar filtro global;
- enviar datas explícitas para todas as integrações;
- implementar comparação.

## 23.2 Wake — definição de captado

Situação atual:

- filtra pedidos usando `valido`;
- trata pedidos válidos como proxy de captado.

Correção:

- captado = todos os pedidos criados;
- faturado = status pagos validados;
- remover a dependência do proxy após o mapeamento.

## 23.3 Wake — limite de 1.000 pedidos

Situação atual:

```ts
MAX_PAGES = 20 // 20 x 50 = 1000 pedidos
```

Correção:

- implementar paginação completa;
- respeitar limite real da API;
- detectar e exibir truncamento;
- não permitir que um mês com mais de 1.000 pedidos seja calculado parcialmente.

## 23.4 Funil GA4

Situação atual:

- utiliza `eventCount`;
- possui apenas view_item, add_to_cart, begin_checkout e purchase.

Correção:

- utilizar sessões ou usuários com evento;
- adicionar view_cart, add_shipping_info e add_payment_info;
- calcular progressão e abandono;
- validar eventos;
- permitir dispositivo e canal.

## 23.5 GA4 — usuários

Situação atual:

- `totalUsers` é somado entre linhas de canal;
- um mesmo usuário pode aparecer em mais de um canal, gerando supercontagem.

Correção:

- consultar o total geral em uma query sem dimensão;
- usar as linhas por canal somente para detalhamento.

## 23.6 GA4 — conversão

Situação atual:

- utiliza métrica genérica de conversões.

Correção:

- para e-commerce, utilizar transações/ecommerce purchases;
- separar outras conversões ou key events.

## 23.7 SEO

Situação atual:

- a tela mostra todos os canais GA4;
- não existe integração de Search Console.

Correção:

- integrar GSC;
- filtrar GA4 para Organic Search;
- implementar branded/non-branded, queries, páginas e oportunidades.

## 23.8 CRM

Situação atual:

- integração retorna não configurado;
- CRM aparece dentro de E-commerce.

Correção:

- conectar Wake CRM;
- criar aba própria;
- manter receita Wake CRM e receita GA4 separadas.

## 23.9 Meta Ads

Situação atual:

- soma qualquer action_type contendo `purchase`;
- status da campanha é hardcoded;
- paginação não está tratada.

Correção:

- mapear actions exatas de compra;
- evitar dupla contagem entre tipos de ação;
- consultar status real das campanhas;
- percorrer `paging.next`;
- buscar níveis campanha, conjunto, anúncio e criativo.

## 23.10 Google Ads

Situação atual:

- visão principal limitada a campanha;
- paginação e níveis detalhados precisam ser validados;
- não há keyword, search term, asset group e produto.

Correção:

- implementar paginação;
- consultas específicas por tipo de campanha;
- adicionar drill-down;
- integrar dados de Shopping/PMax e Merchant Center quando possível.

## 23.11 Orgânico social

Situação atual:

- parte das credenciais não está validada;
- handles foram inferidos;
- TikTok não tem rota final;
- dados por post podem não estar disponíveis.

Correção:

- validar contas e credenciais;
- confirmar handles;
- confirmar fonte TikTok;
- não exibir dados de exemplo como reais;
- indicar indisponibilidade de top posts caso a fonte não entregue granularidade.

## 23.12 Datas e timezone

Correção:

- normalizar tudo para `America/Sao_Paulo`;
- documentar se a API devolve UTC;
- evitar deslocamento de pedidos e investimento entre dias.

## 23.13 Paginação geral

Revisar paginação de:

- Wake;
- Meta Ads;
- Google Ads;
- Search Console;
- demais fontes.

Nenhuma tabela ou KPI pode ser calculado apenas com a primeira página sem alerta.

---

# 24. PRIORIDADES DE IMPLEMENTAÇÃO

## P0 — Obrigatório para o próximo check-in

1. Filtro global de datas;
2. comparações de período;
3. tratamento de dia parcial;
4. definição correta de captado e faturado;
5. paginação completa da Wake;
6. Overview consolidado;
7. KPIs com fórmulas e fontes;
8. receita versus investimento versus MER;
9. funil corrigido com shipping e payment;
10. receita por canal GA4;
11. mídia paga consolidada;
12. receita plataforma versus receita GA4;
13. metas e pace básico;
14. SEO filtrado corretamente;
15. status de qualidade das fontes;
16. ocultação de páginas sem integração real.

## P1 — Evolução imediata

1. Drill-down Meta;
2. drill-down Google;
3. criativos;
4. produtos, marcas e categorias;
5. regiões;
6. CRM completo;
7. Search Console completo;
8. orgânico social com credenciais validadas;
9. Merchant Center;
10. estoque;
11. Modo Check-in com ações e anotações;
12. Clarity.

## P2 — Maturidade

1. Clientes e LTV;
2. coortes e recompra;
3. forecast por cenários;
4. score de produtos;
5. alertas automáticos avançados;
6. detecção de anomalias;
7. previsão de ruptura;
8. conciliação pedido-campanha com identificadores;
9. análise de interação Meta gerando demanda para Google.

---

# 25. CRITÉRIOS DE ACEITE

O improve será considerado apto quando:

- não existir período fixo de 7 dias;
- todas as telas respeitarem o filtro global;
- as comparações utilizarem períodos equivalentes;
- dia parcial estiver tratado;
- captado representar todos os pedidos;
- faturado representar somente pedidos pagos;
- status Wake estiver documentado;
- paginação Wake não truncar pedidos;
- funil não utilizar eventCount bruto como volume principal;
- shipping e payment estiverem presentes;
- taxa de aprovação estiver correta;
- receita GA4 estiver identificada como diagnóstica;
- receita das plataformas não for somada como faturamento;
- MER faturado utilizar Wake faturada ÷ investimento;
- ROAS de plataforma e ROAS GA4 estiverem separados;
- SEO utilizar Search Console + Organic Search;
- CRM possuir aba própria;
- metas forem cadastráveis;
- pace for calculado com dias fechados;
- métricas de eficiência não usarem pace linear de volume;
- cards exibirem fonte, fórmula e atualização;
- dados indisponíveis não aparecerem como zero;
- erros de API e credenciais forem visíveis internamente;
- todas as listas usarem paginação completa;
- rankings controlarem amostra mínima;
- `npm run lint` e `npm run build` passarem sem erro.

---

# 26. ENTREGÁVEIS ESPERADOS DO TIME TECH

1. Código implementado no repositório atual;
2. matriz de disponibilidade por fonte;
3. mapeamento dos status pagos da Wake;
4. dicionário final de métricas;
5. tabela de UTMs e canais;
6. documentação das credenciais necessárias;
7. lista de limitações das APIs;
8. alternativa sugerida para cada limitação;
9. plano P0, P1 e P2 atualizado;
10. evidência de reconciliação dos principais KPIs;
11. evidência de lint e build;
12. checklist de homologação.

Formato para impeditivos:

| Requisito | Status | Limitação | Impacto | Alternativa | Esforço | Recomendação |
|---|---|---|---|---|---|---|

Status permitidos:

- disponível;
- parcial;
- exige ajuste;
- exige desenvolvimento;
- indisponível.

---

# 27. ORIENTAÇÃO FINAL PARA EXECUÇÃO PELA IA

Ao receber este documento junto do repositório:

1. leia `README.md`, `app/`, `components/`, `lib/data/` e os documentos do projeto;
2. trate este arquivo como a especificação mais recente;
3. não reconstrua o dashboard do zero sem justificativa;
4. preserve componentes e estilos úteis;
5. crie primeiro a camada global de datas e comparação;
6. refatore as integrações para receber `DateRange`;
7. corrija Wake e GA4 antes de adicionar novos gráficos;
8. implemente P0 por completo;
9. use dados reais ou estado indisponível;
10. não criar mocks apresentados como dados da cliente;
11. adicionar tooltips de fórmula e fonte;
12. manter as metodologias de receita separadas;
13. registrar limitações técnicas encontradas;
14. executar testes, lint e build;
15. entregar um resumo das alterações, arquivos modificados e pendências.

O resultado final deve transformar o dashboard atual em uma ferramenta de gestão e check-in capaz de mostrar, com clareza:

> resultado → meta → causa → gargalo → ação.
