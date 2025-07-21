import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Navegação
 * Testa a navegação entre todas as páginas da aplicação
 */
test.describe('1. Testes de Navegação', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navegar para a página inicial
    await page.goto('/');
    
    // Aguardar carregamento completo
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Deve navegar corretamente entre todas as páginas principais', async ({ page }) => {
    console.log('🧪 Testando navegação entre páginas principais...');

    // Verificar página inicial (Home)
    await expect(page).toHaveURL(/.*\/tabs\/home/);
    console.log('✅ Página Home carregada');

    // Navegar para Capturados
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForURL(/.*\/tabs\/captured/);
    await page.waitForSelector('.captured-content', { timeout: 10000 });
    console.log('✅ Navegação para Capturados funcionando');

    // Navegar para Favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForURL(/.*\/tabs\/favorites/);
    await page.waitForSelector('.favorites-content', { timeout: 10000 });
    console.log('✅ Navegação para Favoritos funcionando');

    // Navegar para Ranking
    await page.click('ion-tab-button[tab="ranking"]');
    await page.waitForURL(/.*\/tabs\/ranking/);
    await page.waitForSelector('.ranking-content', { timeout: 10000 });
    console.log('✅ Navegação para Ranking funcionando');

    // Navegar para Configurações
    await page.click('ion-tab-button[tab="settings"]');
    await page.waitForURL(/.*\/tabs\/settings/);
    await page.waitForSelector('.settings-content', { timeout: 10000 });
    console.log('✅ Navegação para Configurações funcionando');

    // Voltar para Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForURL(/.*\/tabs\/home/);
    await page.waitForSelector('app-pokemon-card', { timeout: 10000 });
    console.log('✅ Retorno para Home funcionando');
  });

  test('Deve manter estado da navegação ao voltar', async ({ page }) => {
    console.log('🧪 Testando persistência de estado na navegação...');

    // Aplicar filtro na página inicial
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });
    
    // Selecionar tipo fogo
    await page.click('ion-chip:has-text("Fogo")');
    await page.waitForTimeout(2000);
    
    // Navegar para outra página
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForURL(/.*\/tabs\/captured/);
    
    // Voltar para Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForURL(/.*\/tabs\/home/);
    
    // Verificar se o filtro ainda está aplicado
    const fireChip = page.locator('ion-chip:has-text("Fogo").selected');
    await expect(fireChip).toBeVisible();
    console.log('✅ Estado dos filtros mantido após navegação');
  });

  test('Deve funcionar navegação por breadcrumbs (se aplicável)', async ({ page }) => {
    console.log('🧪 Testando navegação por breadcrumbs...');

    // Abrir modal de detalhes
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    
    // Aguardar modal abrir
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    // Verificar se modal está visível
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    
    // Fechar modal usando botão de fechar
    await page.click('app-details-modal ion-button[fill="clear"]');
    await page.waitForTimeout(1000);
    
    // Verificar se voltou para a lista
    await expect(page.locator('app-pokemon-card')).toBeVisible();
    console.log('✅ Navegação por modal funcionando');
  });

  test('Deve funcionar navegação com teclado', async ({ page }) => {
    console.log('🧪 Testando navegação por teclado...');

    // Focar no primeiro card
    await page.locator('app-pokemon-card').first().focus();
    
    // Pressionar Enter para abrir
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // Verificar se modal abriu
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    
    // Pressionar Escape para fechar
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    console.log('✅ Navegação por teclado funcionando');
  });

  test('Deve validar URLs e rotas corretas', async ({ page }) => {
    console.log('🧪 Testando URLs e rotas...');

    const routes = [
      { tab: 'home', url: '/tabs/home', selector: 'app-pokemon-card' },
      { tab: 'captured', url: '/tabs/captured', selector: '.captured-content' },
      { tab: 'favorites', url: '/tabs/favorites', selector: '.favorites-content' },
      { tab: 'ranking', url: '/tabs/ranking', selector: '.ranking-content' },
      { tab: 'settings', url: '/tabs/settings', selector: '.settings-content' }
    ];

    for (const route of routes) {
      await page.click(`ion-tab-button[tab="${route.tab}"]`);
      await page.waitForURL(new RegExp(`.*${route.url}`));
      
      // Verificar se o conteúdo específico da página está presente
      await page.waitForSelector(route.selector, { timeout: 10000 });
      
      console.log(`✅ Rota ${route.url} funcionando corretamente`);
    }
  });
});
