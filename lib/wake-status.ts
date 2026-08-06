/**
 * Mapeamento de status pagos da Wake (briefing v3, seção 5.6).
 *
 * IMPORTANTE — PENDENTE VALIDAÇÃO DO TIME WAKE/SUMIRÊ:
 * O endpoint oficial `GET /situacoesPedido` (que devolveria nome+descrição de
 * cada `situacaoPedidoId`) retornou 401 com a chave de API atual — mesma chave
 * que autentica normalmente em `/pedidos`, então é falta de escopo/permissão
 * nessa credencial, não um problema de auth. Não temos os nomes oficiais das
 * situações.
 *
 * Na ausência do endpoint, os IDs abaixo foram derivados **estatisticamente**
 * de uma amostra real de 2000 pedidos dos últimos 90 dias da própria loja
 * (situacaoPedidoId × presença de dataPagamento):
 *
 *   id  | pedidos | % com dataPagamento | valido
 *   ----|---------|----------------------|-------
 *    1  |    45   |        100%          | true
 *    2  |    19   |          0%          | true   <- capturado, ainda não pago
 *    7  |     3   |          0%          | true   <- capturado, ainda não pago
 *    8  |   350   |          1%          | false  <- cancelado/excluído (não é captado nem faturado)
 *    9  |    72   |        100%          | true
 *   11  |     5   |        100%          | true
 *   18  |  1488   |        100%          | true   <- maioria absoluta dos pedidos
 *   21  |    18   |        100%          | true
 *
 * Os IDs {1, 9, 11, 18, 21} têm dataPagamento em ~100% dos casos — proposta de
 * default para "faturado". Isso é um indício estatístico forte, NÃO uma
 * confirmação semântica (não sabemos se são "Pago", "Faturado", "Entregue"
 * etc. individualmente, nem se cobrem status raros fora da amostra de 90 dias,
 * como reembolso parcial). Pedir ao time Wake/Sumirê para confirmar via painel
 * admin da Wake (Configurações > Situações de Pedido) ou liberar escopo da API
 * key para `/situacoesPedido` antes de tratar isso como definitivo.
 */
export const WAKE_PAID_STATUS_IDS: readonly number[] = [1, 9, 11, 18, 21];

/** Status observado com valido=false e quase nenhum dataPagamento — tratado como cancelado/excluído. */
export const WAKE_CANCELLED_STATUS_IDS: readonly number[] = [8];

export const WAKE_STATUS_MAPPING_VALIDATED = false;
