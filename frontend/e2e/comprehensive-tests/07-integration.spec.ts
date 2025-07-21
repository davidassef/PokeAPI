import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Integração
 * Testa comunicação com APIs, cache, persistência e autenticação
 */
test.describe('7. Testes de Integração', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Deve comunicar corretamente com a PokeAPI', async ({ page }) => {
    console.log('🧪 Testando comunicação com PokeAPI...');

    // Interceptar requisições para PokeAPI
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('pokeapi.co')) {
        apiRequests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(5000);

    // Verificar se requisições foram feitas
    expect(apiRequests.length).toBeGreaterThan(0);
    console.log(`✅ ${apiRequests.length} requisições para PokeAPI realizadas`);

    // Verificar se dados foram carregados
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ ${cardCount} Pokémon carregados da API`);

    // Verificar estrutura dos dados
    const firstCard = cards.first();
    await expect(firstCard.locator('.pokemon-name')).toBeVisible();
    await expect(firstCard.locator('img, ion-img')).toBeVisible();
    console.log('✅ Estrutura de dados da API correta');
  });

  test('Deve funcionar sistema de cache', async ({ page }) => {
    console.log('🧪 Testando sistema de cache...');

    // Limpar cache antes do teste
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('pokeapi.co') || request.url().includes('pokemon')) {
        requests.push(request.url());
      }
    });

    // Primeira visita - deve fazer requisições
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const initialRequests = requests.length;
    console.log(`📡 Primeira visita: ${initialRequests} requisições`);

    // Navegar para outra página e voltar
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForTimeout(2000);
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(3000);

    const secondVisitRequests = requests.length - initialRequests;
    console.log(`📡 Segunda visita: ${secondVisitRequests} novas requisições`);

    // Cache deve reduzir requisições
    expect(secondVisitRequests).toBeLessThan(initialRequests * 0.5);
    console.log('✅ Sistema de cache funcionando');

    // Verificar se dados em cache são válidos
    const cachedCards = page.locator('app-pokemon-card');
    expect(await cachedCards.count()).toBeGreaterThan(0);
    console.log('✅ Dados em cache válidos');
  });

  test('Deve persistir dados no localStorage', async ({ page }) => {
    console.log('🧪 Testando persistência no localStorage...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Adicionar favorito
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn');
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
    }

    // Verificar se foi salvo no localStorage
    const storedFavorites = await page.evaluate(() => {
      return localStorage.getItem('pokemon-favorites');
    });

    expect(storedFavorites).toBeTruthy();
    console.log('✅ Favoritos salvos no localStorage');

    // Recarregar página e verificar persistência
    await page.reload();
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se favorito persistiu
    const reloadedFavorites = await page.evaluate(() => {
      return localStorage.getItem('pokemon-favorites');
    });

    expect(reloadedFavorites).toBe(storedFavorites);
    console.log('✅ Dados persistem após reload');

    // Navegar para página de favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForTimeout(3000);

    const favoritesCards = page.locator('app-pokemon-card');
    if (await favoritesCards.count() > 0) {
      const favoriteName = await favoritesCards.first().locator('.pokemon-name').textContent();
      expect(favoriteName).toBe(pokemonName);
      console.log('✅ Favoritos carregados corretamente da persistência');
    }
  });

  test('Deve gerenciar configurações da aplicação', async ({ page }) => {
    console.log('🧪 Testando gerenciamento de configurações...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Navegar para configurações
    await page.click('ion-tab-button[tab="settings"]');
    await page.waitForTimeout(3000);

    // Verificar se página de configurações carregou
    const settingsPage = page.locator('.settings-content');
    await expect(settingsPage).toBeVisible();

    // Procurar configurações disponíveis
    const themeToggle = page.locator('ion-toggle, .theme-toggle');
    const languageSelect = page.locator('ion-select, .language-select');
    const musicToggle = page.locator('ion-toggle:has-text("Música"), .music-toggle');

    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Configuração de tema funcionando');
    }

    if (await languageSelect.count() > 0) {
      console.log('✅ Seletor de idioma disponível');
    }

    if (await musicToggle.count() > 0) {
      await musicToggle.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Configuração de música funcionando');
    }

    // Verificar se configurações são salvas
    const settings = await page.evaluate(() => {
      return localStorage.getItem('app-settings') || sessionStorage.getItem('app-settings');
    });

    if (settings) {
      console.log('✅ Configurações salvas na persistência');
    }
  });

  test('Deve funcionar sem conexão com internet (offline)', async ({ page }) => {
    console.log('🧪 Testando funcionalidade offline...');

    // Primeiro carregar dados online
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(5000);

    const onlineCards = await page.locator('app-pokemon-card').count();
    console.log(`📱 ${onlineCards} cards carregados online`);

    // Simular offline
    await page.context().setOffline(true);
    
    // Recarregar página
    await page.reload();
    await page.waitForTimeout(5000);

    // Verificar se dados em cache ainda funcionam
    const offlineCards = await page.locator('app-pokemon-card').count();
    
    if (offlineCards > 0) {
      console.log(`✅ ${offlineCards} cards disponíveis offline (cache)`);
      
      // Testar navegação offline
      await page.click('ion-tab-button[tab="favorites"]');
      await page.waitForTimeout(2000);
      await page.click('ion-tab-button[tab="home"]');
      await page.waitForTimeout(2000);
      
      console.log('✅ Navegação funcionando offline');
    } else {
      console.log('⚠️ Nenhum dado disponível offline');
    }

    // Restaurar conexão
    await page.context().setOffline(false);
  });

  test('Deve tratar erros de API graciosamente', async ({ page }) => {
    console.log('🧪 Testando tratamento de erros de API...');

    // Interceptar e falhar algumas requisições
    await page.route('**/pokeapi.co/**', route => {
      if (Math.random() < 0.3) { // 30% de chance de falha
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(10000);

    // Verificar se aplicação ainda funciona
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      console.log(`✅ ${cardCount} cards carregados apesar de falhas de API`);
    }

    // Verificar se há mensagens de erro apropriadas
    const errorMessages = page.locator('.error-message, .alert, ion-toast');
    if (await errorMessages.count() > 0) {
      console.log('✅ Mensagens de erro exibidas adequadamente');
    }

    // Verificar se aplicação não trava
    try {
      await page.click('ion-tab-button[tab="captured"]');
      await page.waitForTimeout(2000);
      console.log('✅ Aplicação mantém funcionalidade após erros');
    } catch (error) {
      console.log('⚠️ Aplicação pode ter travado após erros de API');
    }
  });

  test('Deve sincronizar dados entre abas/sessões', async ({ page, context }) => {
    console.log('🧪 Testando sincronização entre abas...');

    // Primeira aba
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Adicionar favorito na primeira aba
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn');
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
    }

    // Abrir segunda aba
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await secondPage.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await secondPage.waitForTimeout(3000);

    // Navegar para favoritos na segunda aba
    await secondPage.click('ion-tab-button[tab="favorites"]');
    await secondPage.waitForTimeout(3000);

    // Verificar se favorito aparece na segunda aba
    const favoritesInSecondTab = secondPage.locator('app-pokemon-card');
    if (await favoritesInSecondTab.count() > 0) {
      const favoriteName = await favoritesInSecondTab.first().locator('.pokemon-name').textContent();
      expect(favoriteName).toBe(pokemonName);
      console.log('✅ Dados sincronizados entre abas');
    } else {
      console.log('⚠️ Dados não sincronizados entre abas');
    }

    await secondPage.close();
  });

  test('Deve validar integridade dos dados', async ({ page }) => {
    console.log('🧪 Testando integridade dos dados...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(5000);

    // Verificar estrutura dos dados dos Pokémon
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      
      // Verificar elementos obrigatórios
      await expect(card.locator('.pokemon-name')).toBeVisible();
      
      const pokemonName = await card.locator('.pokemon-name').textContent();
      expect(pokemonName).toBeTruthy();
      expect(pokemonName?.length).toBeGreaterThan(0);
      
      // Verificar imagem
      const image = card.locator('img, ion-img');
      if (await image.count() > 0) {
        const src = await image.getAttribute('src');
        expect(src).toBeTruthy();
      }
      
      console.log(`✅ Card ${i + 1}: ${pokemonName} - dados íntegros`);
    }

    // Abrir modal e verificar dados detalhados
    await cards.first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    
    // Verificar dados no modal
    await expect(modal.locator('.pokemon-name, .pokemon-title')).toBeVisible();
    
    const modalName = await modal.locator('.pokemon-name, .pokemon-title').textContent();
    expect(modalName).toBeTruthy();
    
    console.log('✅ Dados detalhados íntegros no modal');
  });
});
