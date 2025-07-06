# Sincronização Completa com Verificação de Consistência

## Visão Geral

Esta funcionalidade implementa uma sincronização completa entre o backend e os clientes, garantindo que o banco de dados reflita exatamente o estado atual dos Pokémons capturados em todos os clientes conectados.

## Funcionalidades Implementadas

### Backend (`PullSyncService`)

#### Método: `full_sync_with_consistency_check()`
- **Localização**: `backend/app/services/pull_sync_service.py`
- **Endpoint**: `POST /api/v1/pull-sync/sync-complete-state`
- **Funcionalidade**: Realiza sincronização completa com verificação de consistência

**Processo:**
1. **Coleta de Dados**: Consulta todos os clientes registrados para obter suas capturas ativas
2. **Comparação**: Compara as capturas dos clientes com os favoritos no banco de dados
3. **Sincronização**: Adiciona/remove Pokémons para manter consistência
4. **Relatório**: Retorna relatório detalhado da operação

**Resposta:**
```json
{
  "success": true,
  "clients_checked": 1,
  "failed_clients": [],
  "total_client_captures": 5,
  "total_db_favorites": 3,
  "added_count": 2,
  "removed_count": 0,
  "processing_time": 1.5
}
```

### Frontend (Angular/Ionic)

#### Serviço: `PullSyncControlService`
- **Localização**: `frontend/src/app/core/services/pull-sync-control.service.ts`
- **Método**: `forceSyncCompleteWithVerification()`
- **Funcionalidade**: Chama o endpoint de sincronização completa

#### Componente: `SyncAdminComponent`
- **Localização**: `frontend/src/app/pages/sync-admin/`
- **Método**: `forceSyncCompleteWithVerification()`
- **UI**: Botão "Sincronização Completa com Verificação"

**Funcionalidades da UI:**
- Executa sincronização completa
- Exibe toast de sucesso/erro
- Mostra dialog com detalhes do resultado
- Atualiza status após execução

## Como Usar

### 1. Pela Interface Web (Ionic)

1. Acesse a página de Administração de Sincronização
2. Clique no botão "Sincronização Completa com Verificação"
3. Aguarde a execução (pode levar alguns segundos)
4. Visualize o resultado no dialog de detalhes

### 2. Via API Direta

```bash
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-complete-state \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Teste HTML Simples

Execute o arquivo `frontend/teste-sincronizacao-completa.html` em um navegador para testar a funcionalidade com interface melhorada.

### 4. Componente Angular de Teste

Use o componente `SyncCompleteTestComponent` (`frontend/src/app/sync-complete-test.component.ts`) para testes integrados no Angular.

## Configuração

### Endpoints Configurados

No `SyncConfigService`:
- Endpoint: `syncCompleteState: ${backendUrl}/api/v1/pull-sync/sync-complete-state`
- Comando cURL: `forceSyncCompleteState`

### Dependências

- Backend FastAPI rodando em `http://localhost:8000`
- Clientes registrados no sistema pull-sync
- Banco de dados PostgreSQL/SQLite configurado

## Logs e Monitoramento

A funcionalidade gera logs detalhados:

```
🔄 Iniciando sincronização completa com verificação de consistência
📱 Cliente user_1: 5 capturas ativas
🏗️  Capturas nos clientes: 5
🏛️  Favoritos no banco: 3
➕ Adicionado: Pikachu (ID: 25)
➕ Adicionado: Charizard (ID: 6)
🎯 Sincronização completa concluída: +2, -0, 1.50s
```

## Tratamento de Erros

- **Clientes inativos**: Registrados como `failed_clients`
- **Timeout**: Configurado para 15 segundos por cliente
- **Erros de banco**: Logados mas não interrompem o processo
- **Rollback**: Não implementado (operações são atômicas)

## Casos de Uso

1. **Recuperação de Dados**: Quando houver inconsistência entre clientes e banco
2. **Migração**: Após mudanças na estrutura do banco
3. **Auditoria**: Para verificar integridade dos dados
4. **Backup/Restore**: Para sincronizar após restauração

## Limitações Atuais

- User ID fixo (1) - será melhorado para suportar múltiplos usuários
- Não há rollback automático em caso de erro parcial
- Pokémons removidos manualmente do banco podem ser re-adicionados
- Timeout fixo de 15 segundos por cliente

## Próximos Passos

1. Implementar suporte a múltiplos usuários
2. Adicionar rollback em caso de erro
3. Implementar modo dry-run (simulação)
4. Adicionar filtros por período ou cliente específico
5. Implementar verificação de integridade mais robusta

## Testes

- **Teste unitário**: `pull-sync-control.service.sync-complete.spec.ts`
- **Teste de integração**: `teste-sincronizacao-completa.html`
- **Teste de endpoint**: `test_sync_complete_endpoint.py`
- **Componente de teste**: `sync-complete-test.component.ts`

## Troubleshooting

### Erro: "No pipe found with name 'json'"

**Problema**: O pipe `json` não está disponível no componente.

**Solução**: Importar o `CommonModule` e usar um método personalizado:

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <pre>{{ getResultJson() }}</pre>
    </div>
  `
})
export class TestSyncComponent {
  result: any = null;

  getResultJson(): string {
    return JSON.stringify(this.result, null, 2);
  }
}
```

### Erro: CORS

**Problema**: Erro de CORS ao fazer requisições do frontend para o backend.

**Solução**: Certifique-se de que o backend FastAPI está configurado com CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Erro: Backend não disponível

**Problema**: Frontend não consegue conectar com o backend.

**Solução**:
1. Verifique se o backend está rodando em `http://localhost:8000`
2. Teste a conectividade: `curl http://localhost:8000/api/v1/pull-sync/status`
3. Verifique logs do backend para erros de inicialização

## Monitoramento

Para monitorar a funcionalidade:

1. Verifique logs do backend
2. Use a interface de administração
3. Monitore métricas de tempo de resposta
4. Acompanhe erros de clientes inativos
