import { test, expect } from '@playwright/test';

/**
 * Teste específico para debug da evolução
 */

test.describe('Debug Evolução', () => {

  test('Capturar logs da evolução durante abertura do modal', async ({ page }) => {
    console.log('🧬 Iniciando captura de logs da evolução...');

    // Array para capturar logs do console
    const logs: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      
      // Mostrar logs relacionados à evolução em tempo real
      if (text.includes('evolução') || 
          text.includes('evolution') || 
          text.includes('cadeia') ||
          text.includes('loadEvolutionChain') ||
          text.includes('processEvolutionChain') ||
          text.includes('species') ||
          text.includes('Evolution')) {
        console.log('🖥️ Console:', `[${msg.type()}] ${text}`);
      }
    });

    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar carregamento
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📋 Página carregada, clicando no primeiro card...');

    // Clicar no primeiro card
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();

    // Aguardar modal abrir
    await page.waitForTimeout(5000);

    // Verificar se o modal existe
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalExists = await modal.count();

    if (modalExists > 0) {
      console.log('✅ Modal aberto, tentando clicar na aba de evolução...');

      // Tentar clicar na aba Evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      const evolutionCount = await evolutionTab.count();

      console.log(`🔍 Abas de Evolução encontradas: ${evolutionCount}`);

      if (evolutionCount > 0) {
        await evolutionTab.first().click();
        console.log('🖱️ Clicou na aba Evolução');

        // Aguardar carregamento da evolução
        await page.waitForTimeout(10000);

        // Verificar se a seção de evolução apareceu
        const evolutionContent = modal.locator('.evolution-content');
        const evolutionVisible = await evolutionContent.count();

        console.log(`🧬 Conteúdo de evolução: ${evolutionVisible}`);

        // Verificar se há loading infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner');
        const isLoading = await loadingSpinner.count();

        console.log(`⏳ Spinners de loading: ${isLoading}`);

        // Verificar se há cadeia de evolução
        const evolutionChain = modal.locator('.evolution-chain');
        const hasChain = await evolutionChain.count();

        console.log(`🔗 Cadeia de evolução: ${hasChain}`);

        // Verificar se há mensagem de "sem evolução"
        const noEvolution = modal.locator('.no-evolution');
        const hasNoEvolution = await noEvolution.count();

        console.log(`🚫 Mensagem "sem evolução": ${hasNoEvolution}`);
      }
    }

    // Filtrar logs específicos de evolução
    const evolutionLogs = logs.filter(log => 
      log.includes('evolução') || 
      log.includes('evolution') ||
      log.includes('cadeia') ||
      log.includes('loadEvolutionChain') ||
      log.includes('processEvolutionChain') ||
      log.includes('species') ||
      log.includes('Evolution')
    );

    console.log('\n🧬 LOGS DE EVOLUÇÃO ENCONTRADOS:');
    console.log('================================');
    evolutionLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

    // Tirar screenshot
    await page.screenshot({ path: 'debug-evolution.png', fullPage: true });
    console.log('📸 Screenshot salvo como debug-evolution.png');
  });

});
