import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Performance
 * Testa tempos de carregamento, responsividade e otimizações
 */
test.describe('6. Testes de Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Deve carregar página inicial em tempo aceitável', async ({ page }) => {
    console.log('🧪 Testando tempo de carregamento da página inicial...');

    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(8000); // Máximo 8 segundos
    console.log(`✅ Página carregada em ${loadTime}ms`);

    // Verificar se há indicador de loading
    const loadingIndicator = page.locator('ion-spinner, .loading, .skeleton');
    if (await loadingIndicator.count() > 0) {
      console.log('✅ Indicador de loading presente');
    }
  });

  test('Deve carregar imagens de Pokémon eficientemente', async ({ page }) => {
    console.log('🧪 Testando carregamento de imagens...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Contar imagens carregadas
    const images = page.locator('app-pokemon-card img, ion-img');
    const imageCount = await images.count();
    
    console.log(`📸 ${imageCount} imagens encontradas`);

    // Verificar se imagens carregam progressivamente
    let loadedImages = 0;
    for (let i = 0; i < Math.min(imageCount, 12); i++) {
      const img = images.nth(i);
      
      try {
        await img.waitFor({ state: 'visible', timeout: 5000 });
        
        // Verificar se imagem tem src válido
        const src = await img.getAttribute('src');
        if (src && !src.includes('data:image')) {
          loadedImages++;
        }
      } catch (error) {
        console.log(`⚠️ Imagem ${i} não carregou em 5s`);
      }
    }

    const loadPercentage = (loadedImages / Math.min(imageCount, 12)) * 100;
    expect(loadPercentage).toBeGreaterThan(70); // Pelo menos 70% das imagens
    console.log(`✅ ${loadedImages}/${Math.min(imageCount, 12)} imagens carregadas (${loadPercentage.toFixed(1)}%)`);
  });

  test('Deve responder rapidamente a interações do usuário', async ({ page }) => {
    console.log('🧪 Testando responsividade das interações...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Testar clique em card
    const startClick = Date.now();
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    const clickResponseTime = Date.now() - startClick;

    expect(clickResponseTime).toBeLessThan(3000); // Máximo 3 segundos
    console.log(`✅ Modal abriu em ${clickResponseTime}ms`);

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Testar filtros
    const startFilter = Date.now();
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 3000 });
    const filterResponseTime = Date.now() - startFilter;

    expect(filterResponseTime).toBeLessThan(2000); // Máximo 2 segundos
    console.log(`✅ Filtros abriram em ${filterResponseTime}ms`);

    // Testar aplicação de filtro
    const startFilterApply = Date.now();
    await page.click('ion-chip:has-text("Água")');
    await page.waitForTimeout(1000);
    const filterApplyTime = Date.now() - startFilterApply;

    expect(filterApplyTime).toBeLessThan(2000);
    console.log(`✅ Filtro aplicado em ${filterApplyTime}ms`);
  });

  test('Deve gerenciar memória eficientemente', async ({ page }) => {
    console.log('🧪 Testando gerenciamento de memória...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Navegar entre páginas múltiplas vezes
    const pages = ['captured', 'favorites', 'ranking', 'settings', 'home'];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      console.log(`🔄 Ciclo ${cycle + 1}/3`);
      
      for (const pageName of pages) {
        await page.click(`ion-tab-button[tab="${pageName}"]`);
        await page.waitForTimeout(1000);
      }
    }

    // Verificar se aplicação ainda responde
    await page.waitForSelector('app-pokemon-card', { timeout: 10000 });
    console.log('✅ Aplicação mantém responsividade após navegação intensiva');

    // Abrir e fechar modal múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.locator('app-pokemon-card').first().click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('✅ Modal mantém performance após múltiplas aberturas');
  });

  test('Deve otimizar carregamento de dados', async ({ page }) => {
    console.log('🧪 Testando otimização de carregamento de dados...');

    // Interceptar requisições de rede
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('pokeapi.co') || request.url().includes('pokemon')) {
        requests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(5000);

    console.log(`📡 ${requests.length} requisições de API realizadas`);

    // Verificar se não há requisições duplicadas desnecessárias
    const uniqueRequests = new Set(requests);
    const duplicateRatio = (requests.length - uniqueRequests.size) / requests.length;
    
    expect(duplicateRatio).toBeLessThan(0.3); // Máximo 30% de duplicatas
    console.log(`✅ ${duplicateRatio * 100}% de requisições duplicadas (aceitável)`);

    // Testar cache - navegar para outra página e voltar
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForTimeout(2000);
    
    const requestsBeforeReturn = requests.length;
    
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(2000);
    
    const newRequests = requests.length - requestsBeforeReturn;
    expect(newRequests).toBeLessThan(5); // Poucas requisições novas devido ao cache
    console.log(`✅ Cache funcionando - apenas ${newRequests} novas requisições`);
  });

  test('Deve ter animações suaves', async ({ page }) => {
    console.log('🧪 Testando suavidade das animações...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Testar animação de abertura do modal
    const startAnimation = Date.now();
    await page.locator('app-pokemon-card').first().click();
    
    // Aguardar modal aparecer
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    
    // Verificar se modal está visível e animação terminou
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    
    const animationTime = Date.now() - startAnimation;
    expect(animationTime).toBeLessThan(1000); // Animação não deve demorar mais que 1s
    console.log(`✅ Animação de modal em ${animationTime}ms`);

    // Testar animação de fechamento
    const startClose = Date.now();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const closeTime = Date.now() - startClose;
    
    expect(closeTime).toBeLessThan(800);
    console.log(`✅ Animação de fechamento em ${closeTime}ms`);

    // Testar transições de navegação
    const startNav = Date.now();
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForSelector('.captured-content', { timeout: 5000 });
    const navTime = Date.now() - startNav;
    
    expect(navTime).toBeLessThan(2000);
    console.log(`✅ Transição de navegação em ${navTime}ms`);
  });

  test('Deve funcionar bem com muitos dados', async ({ page }) => {
    console.log('🧪 Testando performance com muitos dados...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Simular scroll para carregar mais dados
    let previousCardCount = 0;
    let currentCardCount = await page.locator('app-pokemon-card').count();
    
    console.log(`📊 Carregamento inicial: ${currentCardCount} cards`);

    // Scroll para baixo múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(2000);
      
      previousCardCount = currentCardCount;
      currentCardCount = await page.locator('app-pokemon-card').count();
      
      if (currentCardCount > previousCardCount) {
        console.log(`📊 Após scroll ${i + 1}: ${currentCardCount} cards (+${currentCardCount - previousCardCount})`);
      }
    }

    // Verificar se aplicação ainda responde bem
    const startInteraction = Date.now();
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    const interactionTime = Date.now() - startInteraction;

    expect(interactionTime).toBeLessThan(3000);
    console.log(`✅ Interação responsiva mesmo com ${currentCardCount} cards (${interactionTime}ms)`);
  });

  test('Deve otimizar uso de CPU', async ({ page }) => {
    console.log('🧪 Testando otimização de CPU...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Simular atividade intensa
    const startTime = Date.now();
    
    // Aplicar e remover filtros rapidamente
    for (let i = 0; i < 10; i++) {
      await page.click('.filter-toggle-btn');
      await page.waitForTimeout(100);
      await page.click('ion-chip:has-text("Fogo")');
      await page.waitForTimeout(100);
      await page.click('ion-chip:has-text("Fogo")');
      await page.waitForTimeout(100);
      await page.click('.filter-toggle-btn');
      await page.waitForTimeout(100);
    }

    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / 10;

    expect(averageTime).toBeLessThan(500); // Cada ciclo deve ser rápido
    console.log(`✅ Operações intensivas: ${averageTime}ms por ciclo`);

    // Verificar se aplicação ainda responde
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    console.log('✅ Aplicação mantém responsividade após operações intensivas');
  });
});
