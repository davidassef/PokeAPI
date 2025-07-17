import { test, expect } from '@playwright/test';

test('Quick debug - Capturar logs do modal', async ({ page }) => {
  console.log('🔍 Teste rápido de debug...');
  
  // Capturar logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Observable emitiu dados') || 
        text.includes('Dados do Pokémon carregados') || 
        text.includes('destroy$ Subject') ||
        text.includes('Subscription criada') ||
        text.includes('Iniciando subscription')) {
      console.log(`🖥️ LOG IMPORTANTE: ${text}`);
    }
  });
  
  await page.goto('/');
  await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('📋 Clicando no primeiro card...');
  await page.locator('app-pokemon-card').first().click();
  
  // Aguardar mais tempo para capturar logs
  await page.waitForTimeout(10000);
  
  const modalExists = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
  console.log(`📊 Modal encontrado: ${modalExists}`);
  
  const tabsCount = await page.locator('app-details-modal .tab-btn').count();
  console.log(`📑 Abas encontradas: ${tabsCount}`);
  
  if (tabsCount === 0) {
    console.log('❌ PROBLEMA CONFIRMADO: Modal não tem abas');
  } else {
    console.log('✅ SUCESSO: Modal tem abas!');
  }
});
