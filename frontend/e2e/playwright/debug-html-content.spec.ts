import { test, expect } from '@playwright/test';

test('Debug HTML Content - Verificar estrutura do modal', async ({ page }) => {
  console.log('🔍 Debugando conteúdo HTML do modal...');
  
  await page.goto('/');
  await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('📋 Clicando no primeiro card...');
  await page.locator('app-pokemon-card').first().click();
  
  await page.waitForTimeout(5000);
  
  // Verificar se o modal existe
  const modalExists = await page.locator('app-details-modal').count();
  console.log(`📊 Modal app-details-modal: ${modalExists}`);
  
  const modalWithOpen = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
  console.log(`📊 Modal com is-open=true: ${modalWithOpen}`);
  
  // Verificar overlay
  const overlay = await page.locator('.details-modal-overlay').count();
  console.log(`📊 Overlay: ${overlay}`);
  
  // Verificar container
  const container = await page.locator('.details-modal-container').count();
  console.log(`📊 Container: ${container}`);
  
  // Verificar abas com diferentes seletores
  const tabsModalTabs = await page.locator('.modal-tabs').count();
  console.log(`📑 .modal-tabs: ${tabsModalTabs}`);
  
  const tabsButton = await page.locator('.modal-tabs button').count();
  console.log(`📑 .modal-tabs button: ${tabsButton}`);
  
  const tabsRole = await page.locator('[role="tab"]').count();
  console.log(`📑 [role="tab"]: ${tabsRole}`);
  
  const tabsAny = await page.locator('button[role="tab"]').count();
  console.log(`📑 button[role="tab"]: ${tabsAny}`);
  
  // Verificar conteúdo das abas
  const tabContent = await page.locator('.tab-content').count();
  console.log(`📄 .tab-content: ${tabContent}`);
  
  // Verificar se há algum conteúdo visível
  const overviewContent = await page.locator('.overview-content').count();
  console.log(`📄 .overview-content: ${overviewContent}`);
  
  // Capturar HTML completo do modal
  if (modalWithOpen > 0) {
    const modalHTML = await page.locator('app-details-modal[ng-reflect-is-open="true"]').innerHTML();
    console.log('📄 HTML do modal (primeiros 500 chars):');
    console.log(modalHTML.substring(0, 500));
    
    // Procurar por texto específico das abas
    const hasOverviewText = modalHTML.includes('modal.overview');
    const hasCombatText = modalHTML.includes('modal.combat');
    const hasEvolutionText = modalHTML.includes('modal.evolution');
    const hasCuriositiesText = modalHTML.includes('modal.curiosities');
    
    console.log(`📝 Textos das abas encontrados:`);
    console.log(`   - Overview: ${hasOverviewText}`);
    console.log(`   - Combat: ${hasCombatText}`);
    console.log(`   - Evolution: ${hasEvolutionText}`);
    console.log(`   - Curiosities: ${hasCuriositiesText}`);
  }
  
  // Screenshot para análise visual
  await page.screenshot({ path: 'debug-modal-html.png', fullPage: true });
  console.log('📸 Screenshot salvo como debug-modal-html.png');
});
