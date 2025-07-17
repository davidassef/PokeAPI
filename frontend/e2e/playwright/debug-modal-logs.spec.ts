import { test, expect } from '@playwright/test';

/**
 * Teste específico para capturar logs do console e debugar o problema do modal
 */

test.describe('Debug Modal Logs', () => {
  
  test('Capturar logs do console durante abertura do modal', async ({ page }) => {
    console.log('🔍 Iniciando captura de logs...');
    
    // Capturar logs do console
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      console.log(`🖥️ Console: [${msg.type()}] ${text}`);
    });
    
    // Capturar erros
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
      logs.push(`[ERROR] ${error.message}`);
    });
    
    // Navegar para a página
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('📋 Página carregada, clicando no primeiro card...');
    
    // Clicar no primeiro card
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    
    // Aguardar um tempo para capturar todos os logs
    await page.waitForTimeout(10000);
    
    // Verificar se o modal existe
    const modalExists = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
    console.log(`📊 Modal encontrado: ${modalExists}`);
    
    if (modalExists > 0) {
      // Verificar se há abas
      const tabsCount = await page.locator('app-details-modal .tab-btn').count();
      console.log(`📑 Abas encontradas: ${tabsCount}`);
      
      // Verificar se há conteúdo
      const contentCount = await page.locator('app-details-modal .pokemon-name, app-details-modal .pokemon-title').count();
      console.log(`🏷️ Conteúdo de nome encontrado: ${contentCount}`);
    }
    
    // Mostrar todos os logs capturados
    console.log('\n📋 LOGS CAPTURADOS:');
    console.log('==================');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    // Verificar se há logs específicos que esperamos
    const hasInitLogs = logs.some(log => log.includes('DetailsModalComponent - ngOnInit'));
    const hasLoadTabLogs = logs.some(log => log.includes('Loading tab data for'));
    const hasOverviewLogs = logs.some(log => log.includes('isOverviewDataReady'));
    
    console.log('\n🔍 ANÁLISE DOS LOGS:');
    console.log('===================');
    console.log(`✅ Logs de inicialização: ${hasInitLogs}`);
    console.log(`✅ Logs de carregamento de aba: ${hasLoadTabLogs}`);
    console.log(`✅ Logs de overview ready: ${hasOverviewLogs}`);
    
    if (!hasInitLogs) {
      console.log('❌ PROBLEMA: Modal não está sendo inicializado');
    }
    
    if (!hasLoadTabLogs) {
      console.log('❌ PROBLEMA: Dados das abas não estão sendo carregados');
    }
    
    if (!hasOverviewLogs) {
      console.log('❌ PROBLEMA: Verificação de dados prontos não está funcionando');
    }
    
    // Tirar screenshot para análise
    await page.screenshot({ path: 'debug-modal-logs.png', fullPage: true });
    console.log('📸 Screenshot salvo como debug-modal-logs.png');
  });
  
  test('Verificar se o Pokemon está sendo passado corretamente', async ({ page }) => {
    console.log('🔍 Verificando passagem de dados do Pokemon...');
    
    // Capturar logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Verificar se há dados de Pokemon na página
    const pokemonCards = await page.locator('app-pokemon-card').count();
    console.log(`📊 Cards de Pokemon encontrados: ${pokemonCards}`);
    
    if (pokemonCards > 0) {
      // Obter dados do primeiro card
      const firstCardData = await page.locator('app-pokemon-card').first().evaluate(el => {
        return {
          innerHTML: el.innerHTML.substring(0, 200),
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
          dataset: (el as any).dataset
        };
      });
      
      console.log('📄 Dados do primeiro card:', firstCardData);
      
      // Clicar no card
      await page.locator('app-pokemon-card').first().click();
      await page.waitForTimeout(5000);
      
      // Verificar se o modal recebeu os dados
      const modalData = await page.locator('app-details-modal').first().evaluate(el => {
        const component = (el as any).__ngContext__?.[0];
        return {
          hasComponent: !!component,
          pokemon: component?.pokemon ? {
            id: component.pokemon.id,
            name: component.pokemon.name
          } : null,
          pokemonId: component?.pokemonId,
          isOpen: component?.isOpen
        };
      });
      
      console.log('📊 Dados do modal:', modalData);
      
      if (!modalData.pokemon && !modalData.pokemonId) {
        console.log('❌ PROBLEMA: Modal não recebeu dados do Pokemon');
      } else {
        console.log('✅ Modal recebeu dados do Pokemon');
      }
    }
  });
});
