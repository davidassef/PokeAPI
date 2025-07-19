import { test, expect } from '@playwright/test';

test.describe('Debug Flavor Texts', () => {
  test('Verificar carregamento de flavor texts passo a passo', async ({ page }) => {
    console.log('🔍 Iniciando debug dos flavor texts...');

    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (text.includes('flavor') || text.includes('curiosities') || text.includes('tabDataLoaded') || text.includes('🍃') || text.includes('💬')) {
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
    await page.waitForTimeout(5000);
    console.log('⏳ Aguardou carregamento inicial');

    // Verificar estado inicial
    const initialState = await page.evaluate(() => {
      const modal = document.querySelector('app-details-modal') as any;
      if (modal && modal.componentInstance) {
        const component = modal.componentInstance;
        return {
          pokemon: !!component.pokemon,
          flavorTexts: component.flavorTexts?.length || 0,
          tabDataLoaded: component.tabDataLoaded,
          activeTab: component.activeTab
        };
      }
      return null;
    });

    console.log('🔍 Estado inicial:', JSON.stringify(initialState, null, 2));

    // Clicar na aba Curiosidades
    const curiositiesTab = page.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ }).first();
    await curiositiesTab.click();
    console.log('🖱️ Clicou na aba Curiosidades');

    // Aguardar um pouco
    await page.waitForTimeout(3000);

    // Verificar estado após clicar
    const afterClickState = await page.evaluate(() => {
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

    console.log('🔍 Estado após clicar:', JSON.stringify(afterClickState, null, 2));

    // Verificar se há conteúdo de curiosidades
    const curiositiesContent = await page.locator('.curiosities-content').count();
    const loadingSpinners = await page.locator('.loading-spinner').count();
    const flavorTexts = await page.locator('.flavor-text').count();

    console.log('📄 Conteúdo de curiosidades:', curiositiesContent);
    console.log('⏳ Spinners de loading:', loadingSpinners);
    console.log('💬 Flavor texts no DOM:', flavorTexts);

    // Verificar logs específicos
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('flavor') || 
      log.includes('curiosities') || 
      log.includes('tabDataLoaded') ||
      log.includes('🍃') ||
      log.includes('💬')
    );

    console.log('📋 Logs relevantes:');
    relevantLogs.forEach(log => console.log('  -', log));

    // Tirar screenshot para debug
    await page.screenshot({ path: 'debug-flavor-texts.png', fullPage: true });
    console.log('📸 Screenshot salvo como debug-flavor-texts.png');

    // O teste sempre passa para permitir debug
    expect(true).toBe(true);
  });
});
