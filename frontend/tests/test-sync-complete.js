// Teste rápido para verificar a funcionalidade de sincronização
// Execute este arquivo no console do navegador ou Node.js

async function testSyncCompleteEndpoint() {
    console.log('🔄 Testando endpoint de sincronização completa...');

    const baseUrl = 'http://localhost:8000';

    try {
        // 1. Verificar se o backend está disponível
        console.log('1. Verificando status do backend...');
        const statusResponse = await fetch(`${baseUrl}/api/v1/pull-sync/status`);

        if (!statusResponse.ok) {
            throw new Error(`Backend não disponível: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        console.log('✅ Backend conectado:', statusData);

        // 2. Executar sincronização completa
        console.log('2. Executando sincronização completa...');
        const syncResponse = await fetch(`${baseUrl}/api/v1/pull-sync/sync-complete-state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!syncResponse.ok) {
            throw new Error(`Erro na sincronização: ${syncResponse.status}`);
        }

        const syncData = await syncResponse.json();
        console.log('✅ Sincronização concluída:', syncData);

        // 3. Mostrar resumo
        if (syncData.success) {
            console.log(`
🎯 RESUMO DA SINCRONIZAÇÃO:
• Clientes consultados: ${syncData.clients_consulted || 0}
• Pokémons nos clientes: ${syncData.total_captured_in_clients || 0}
• Pokémons no banco: ${syncData.total_in_database || 0}
• Adicionados: ${syncData.added_to_database || 0}
• Removidos: ${syncData.removed_from_database || 0}
• Tempo: ${(syncData.processing_time || 0).toFixed(2)}s
• Erros: ${syncData.client_errors?.length || 0}
            `);
        } else {
            console.error('❌ Sincronização falhou:', syncData.error || 'Erro desconhecido');
        }

        return syncData;

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        throw error;
    }
}

// Para usar em Node.js, descomente as linhas abaixo:
// const fetch = require('node-fetch');
// testSyncCompleteEndpoint().catch(console.error);

// Para usar no navegador, execute:
// testSyncCompleteEndpoint().then(console.log).catch(console.error);

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testSyncCompleteEndpoint };
}
