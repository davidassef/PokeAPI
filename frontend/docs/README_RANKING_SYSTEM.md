# 🏆 Sistema de Ranking - PokeAPIApp

## Visão Geral
O sistema de ranking exibe os Pokémons mais capturados/favoritados globalmente, promovendo engajamento e competição saudável entre usuários.

---

## Como Funciona
- **Backend FastAPI**: expõe endpoint `/ranking` que retorna os Pokémons mais capturados, ordenados por número de capturas e ID.
- **Frontend Angular/Ionic**: consome o endpoint, exibe o Top 3 em pódio animado e os demais em grid responsivo.
- **Sincronização**: capturas feitas localmente são sincronizadas com o backend via serviço dedicado.
- **Limpeza automática**: Pokémons sem vínculo com usuários são removidos do ranking ao consultar.

---

## Arquitetura
- **Backend**: `backend/app/routes/ranking.py`, `services/favorite_service.py`
- **Frontend**: `frontend/src/app/pages/ranking/`
- **Banco de Dados**: Tabela de favoritos/capturas, consulta agregada para ranking

---

## Endpoints Principais
- `GET /ranking?limit=20&min_captures=1` - Retorna os 20 mais capturados
- Parâmetros:
  - `limit`: quantidade de Pokémons
  - `min_captures`: mínimo de capturas para aparecer no ranking

---

## Lógica de Exibição
- **Top 3**: Destaque visual com coroa e medalhas
- **Demais**: Grid de 4 colunas, responsivo, com badges de posição e contagem
- **Auto-refresh**: Atualização automática a cada 1 minuto
- **Padronização visual**: Espaçamento, grid e responsividade igual às páginas de capturados/favoritos

---

## Customização Visual
- Edite apenas:
  - `frontend/src/app/pages/ranking/ranking.page.html`
  - `frontend/src/app/pages/ranking/ranking.page.scss`
- Para alterar espaçamento, ajuste `.ranking-grid-flex` e `.ranking-card-grid`

---

## Dicas e Observações
- O ranking só exibe Pokémons realmente capturados por usuários
- Para testes, ajuste `min_captures` no backend
- O sistema é seguro, performático e fácil de manter

---

## Manutenção
- Para limpar dados de teste, use comandos SQL diretamente no banco
- Para expandir o ranking, basta alterar o parâmetro `limit` no frontend/backend

---

**Dúvidas ou sugestões? Consulte este documento ou abra uma issue!** 