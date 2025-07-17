import { test, expect } from '@playwright/test';

test('Teste Final - Verificar se correção funcionou', async ({ page }) => {
  console.log('🎯 TESTE FINAL: Verificando se a correção funcionou...');
  
  await page.goto('/');
  await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('📋 Clicando no primeiro card...');
  await page.locator('app-pokemon-card').first().click();
  
  await page.waitForTimeout(5000);
  
  // Verificar abas com o seletor correto
  const tabsCount = await page.locator('.tab-btn').count();
  console.log(`📑 Abas encontradas (.tab-btn): ${tabsCount}`);
  
  if (tabsCount > 0) {
    console.log('🎉 SUCESSO! Modal tem abas!');
    
    // Testar clique nas abas
    const tabs = page.locator('.tab-btn');
    const firstTab = tabs.first();
    
    if (await firstTab.count() > 0) {
      await firstTab.click();
      console.log('✅ Primeira aba clicada com sucesso');
    }
    
    expect(tabsCount).toBeGreaterThan(0);
  } else {
    console.log('❌ FALHA: Modal ainda não tem abas');
    expect(tabsCount).toBeGreaterThan(0);
  }
});
