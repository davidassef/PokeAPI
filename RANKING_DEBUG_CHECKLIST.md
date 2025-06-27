# CHECKLIST DE DEBUG - RANKING INFINITO

## PROBLEMA
- Ranking fica carregando infinitamente
- Backend retorna 10 pokémons corretamente
- Frontend recebe dados mas não exibe

## CHECKLIST POR PRIORIDADE

### 🔴 PRIORIDADE 1 - CRÍTICO
- [ ] **1.1** Comentar `await this.syncService.syncPending()` (linha 135)
- [ ] **1.2** Verificar se `loading.dismiss()` está funcionando
- [ ] **1.3** Testar endpoint: `curl http://localhost:8000/api/v1/ranking/?limit=5`

### 🟡 PRIORIDADE 2 - ALTO  
- [ ] **2.1** Comentar botão favorito: `(isFavorite(...) | async)`
- [ ] **2.2** Simplificar template removendo expressões complexas
- [ ] **2.3** Verificar dados no banco: `db.query(FavoritePokemon).count()`

### 🟢 PRIORIDADE 3 - MÉDIO
- [ ] **3.1** Aumentar timeout de 10s para 30s
- [ ] **3.2** Implementar carregamento sequencial em vez de `Promise.all`
- [ ] **3.3** Verificar se CORS está configurado corretamente

## ARQUIVOS PRINCIPAIS
- `ranking.page.ts` - Lógica principal
- `ranking.page.html` - Template  
- `pokeapi.service.ts` - Serviço de API
- `ranking.py` - Endpoint backend
- `favorite_service.py` - Lógica de ranking

## PRÓXIMO PASSO
Começar pela **PRIORIDADE 1** e testar cada item. 