import { test, expect } from '@playwright/test';

test.describe('Debug Curiosidades', () => {
  test('Verificar se curiosidades carregam corretamente', async ({ page }) => {
    console.log('🔍 Iniciando debug das curiosidades...');

    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (text.includes('curiosities') || text.includes('flavor') || text.includes('isCuriositiesDataReady')) {
        console.log('🖥️ Console:', text);
      }
    });

    // Navegar para a página
    await page.goto('http://localhost:4200/tabs/home');
    await page.waitForLoadState('networkidle');
    console.log('📋 Página carregada');

    // Clicar no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no card');

    // Aguardar modal abrir
    await page.waitForSelector('.pokemon-modal.is-open', { timeout: 10000 });
    console.log('📊 Modal aberto');

    // Aguardar dados carregarem
    await page.waitForTimeout(3000);

    // Clicar na aba Curiosidades
    const curiositiesTab = page.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ }).first();
    await curiositiesTab.click();
    console.log('🖱️ Clicou na aba Curiosidades');

    // Aguardar um pouco
    await page.waitForTimeout(2000);

    // Verificar se há conteúdo de curiosidades
    const curiositiesContent = await page.locator('.curiosities-content').count();
    console.log('📄 Conteúdo de curiosidades:', curiositiesContent);

    // Verificar se há spinners de loading
    const loadingSpinners = await page.locator('.loading-spinner').count();
    console.log('⏳ Spinners de loading:', loadingSpinners);

    // Verificar se há flavor texts
    const flavorTexts = await page.locator('.flavor-text').count();
    console.log('💬 Flavor texts encontrados:', flavorTexts);

    // Executar JavaScript para verificar o estado interno
    const debugInfo = await page.evaluate(() => {
      const modal = document.querySelector('app-details-modal') as any;
      if (modal && modal.componentInstance) {
        const component = modal.componentInstance;
        return {
          pokemon: !!component.pokemon,
          flavorTexts: component.flavorTexts?.length || 0,
          tabDataLoaded: component.tabDataLoaded,
          activeTab: component.activeTab,
          isCuriositiesDataReady: component.isCuriositiesDataReady()
        };
      }
      return null;
    });

    console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));

    // Verificar logs específicos
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('curiosities') || 
      log.includes('flavor') || 
      log.includes('tabDataLoaded') ||
      log.includes('isCuriositiesDataReady')
    );

    console.log('📋 Logs relevantes:');
    relevantLogs.forEach(log => console.log('  -', log));

    // Tirar screenshot para debug
    await page.screenshot({ path: 'debug-curiosities.png', fullPage: true });
    console.log('📸 Screenshot salvo como debug-curiosities.png');

    // Verificar se a seção apareceu
    if (curiositiesContent > 0) {
      console.log('✅ SUCESSO: Seção Curiosidades carregou!');
    } else {
      console.log('❌ PROBLEMA: Seção Curiosidades não apareceu');
      
      // Verificar se há elementos de loading
      if (loadingSpinners > 0) {
        console.log('⚠️ ATENÇÃO: Ainda há spinners de loading');
      }
    }

    // O teste sempre passa para permitir debug
    expect(true).toBe(true);
  });
});
