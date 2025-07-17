import { test, expect } from '@playwright/test';

test('Teste da correção - Modal deve ter abas', async ({ page }) => {
  console.log('🧪 Testando correção do modal...');
  
  // Capturar logs importantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('POKEAPI SERVICE') || 
        text.includes('NEXT EXECUTADO') || 
        text.includes('COMPLETE EXECUTADO') ||
        text.includes('ERROR EXECUTADO') ||
        text.includes('Usando PokeApiService')) {
      console.log(`🖥️ LOG CORREÇÃO: ${text}`);
    }
  });
  
  await page.goto('/');
  await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('📋 Clicando no primeiro card...');
  await page.locator('app-pokemon-card').first().click();
  
  // Aguardar mais tempo para a correção funcionar
  await page.waitForTimeout(10000);
  
  const modalExists = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
  console.log(`📊 Modal encontrado: ${modalExists}`);
  
  const tabsCount = await page.locator('app-details-modal .tab-btn').count();
  console.log(`📑 Abas encontradas: ${tabsCount}`);
  
  if (tabsCount > 0) {
    console.log('🎉 SUCESSO: Correção funcionou! Modal tem abas!');
    
    // Testar se as abas funcionam
    const curiositiesTab = page.locator('app-details-modal .tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
    if (await curiositiesTab.count() > 0) {
      await curiositiesTab.click();
      await page.waitForTimeout(3000);
      
      const curiositiesContent = await page.locator('app-details-modal .curiosities-content').count();
      console.log(`📄 Conteúdo de curiosidades: ${curiositiesContent}`);
      
      if (curiositiesContent > 0) {
        console.log('✅ PERFEITO: Seção Curiosidades funciona!');
      }
    }
  } else {
    console.log('❌ PROBLEMA: Correção não funcionou, modal ainda não tem abas');
  }
  
  // Verificar se há conteúdo do Pokémon
  const pokemonName = await page.locator('app-details-modal .pokemon-name, app-details-modal .pokemon-title').count();
  console.log(`🏷️ Nome do Pokémon encontrado: ${pokemonName}`);
  
  expect(tabsCount).toBeGreaterThan(0);
});
