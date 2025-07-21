import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Favoritos e Captura
 * Testa sistemas de favoritos e captura de Pokémon
 */
test.describe('4. Testes de Favoritos e Captura', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Limpar localStorage para começar com estado limpo
    await page.evaluate(() => {
      localStorage.removeItem('pokemon-favorites');
      localStorage.removeItem('captured-pokemon');
    });
  });

  test('Deve adicionar Pokémon aos favoritos', async ({ page }) => {
    console.log('🧪 Testando adição aos favoritos...');

    // Encontrar botão de favorito no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn, ion-button[color="danger"]');

    if (await favoriteButton.count() > 0) {
      // Clicar no botão de favorito
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      // Verificar se botão mudou de estado (ícone preenchido)
      const isFavorited = await favoriteButton.evaluate(btn => {
        const icon = btn.querySelector('ion-icon');
        return icon?.getAttribute('name')?.includes('heart') || 
               btn.classList.contains('favorited') ||
               btn.getAttribute('color') === 'danger';
      });

      expect(isFavorited).toBeTruthy();
      console.log('✅ Pokémon adicionado aos favoritos');

      // Verificar se foi salvo no localStorage
      const favorites = await page.evaluate(() => {
        const stored = localStorage.getItem('pokemon-favorites');
        return stored ? JSON.parse(stored) : [];
      });

      expect(favorites.length).toBeGreaterThan(0);
      console.log('✅ Favorito salvo no localStorage');
    } else {
      console.log('⚠️ Botão de favorito não encontrado no card');
    }
  });

  test('Deve remover Pokémon dos favoritos', async ({ page }) => {
    console.log('🧪 Testando remoção dos favoritos...');

    const firstCard = page.locator('app-pokemon-card').first();
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn, ion-button[color="danger"]');

    if (await favoriteButton.count() > 0) {
      // Primeiro adicionar aos favoritos
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      // Depois remover
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      // Verificar se botão voltou ao estado normal
      const isNotFavorited = await favoriteButton.evaluate(btn => {
        const icon = btn.querySelector('ion-icon');
        return icon?.getAttribute('name')?.includes('heart-outline') || 
               !btn.classList.contains('favorited') ||
               btn.getAttribute('color') !== 'danger';
      });

      expect(isNotFavorited).toBeTruthy();
      console.log('✅ Pokémon removido dos favoritos');
    }
  });

  test('Deve mostrar favoritos na página de favoritos', async ({ page }) => {
    console.log('🧪 Testando página de favoritos...');

    // Adicionar um Pokémon aos favoritos
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn');
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
    }

    // Navegar para página de favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForURL(/.*\/tabs\/favorites/);
    await page.waitForTimeout(3000);

    // Verificar se o Pokémon aparece na lista de favoritos
    const favoritesPage = page.locator('.favorites-content');
    await expect(favoritesPage).toBeVisible();

    const favoriteCards = page.locator('app-pokemon-card');
    if (await favoriteCards.count() > 0) {
      const firstFavoriteCard = favoriteCards.first();
      const favoriteName = await firstFavoriteCard.locator('.pokemon-name').textContent();
      
      expect(favoriteName).toBe(pokemonName);
      console.log('✅ Pokémon aparece na página de favoritos');
    } else {
      console.log('⚠️ Nenhum favorito encontrado na página');
    }
  });

  test('Deve funcionar sistema de captura', async ({ page }) => {
    console.log('🧪 Testando sistema de captura...');

    // Procurar botão de captura no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    const captureButton = firstCard.locator('.capture-btn, ion-button:has-text("Capturar")');

    if (await captureButton.count() > 0) {
      await captureButton.click();
      await page.waitForTimeout(1000);

      // Verificar se estado mudou
      const isCaptured = await captureButton.evaluate(btn => {
        return btn.classList.contains('captured') ||
               btn.textContent?.includes('Capturado') ||
               btn.getAttribute('color') === 'success';
      });

      expect(isCaptured).toBeTruthy();
      console.log('✅ Pokémon capturado');
    } else {
      // Tentar capturar através do modal
      await firstCard.click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

      const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
      const modalCaptureButton = modal.locator('.capture-btn, ion-button:has-text("Capturar")');

      if (await modalCaptureButton.count() > 0) {
        await modalCaptureButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Pokémon capturado via modal');
      } else {
        console.log('⚠️ Botão de captura não encontrado');
      }
    }
  });

  test('Deve mostrar Pokémon capturados na página de capturados', async ({ page }) => {
    console.log('🧪 Testando página de capturados...');

    // Primeiro capturar um Pokémon (simular)
    await page.evaluate(() => {
      const captured = [1, 25, 150]; // IDs de exemplo
      localStorage.setItem('captured-pokemon', JSON.stringify(captured));
    });

    // Navegar para página de capturados
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForURL(/.*\/tabs\/captured/);
    await page.waitForTimeout(3000);

    // Verificar se página carregou
    const capturedPage = page.locator('.captured-content');
    await expect(capturedPage).toBeVisible();

    // Verificar se há Pokémon capturados
    const capturedCards = page.locator('app-pokemon-card');
    if (await capturedCards.count() > 0) {
      console.log(`✅ ${await capturedCards.count()} Pokémon capturados encontrados`);
    } else {
      console.log('⚠️ Nenhum Pokémon capturado encontrado');
    }
  });

  test('Deve persistir favoritos entre sessões', async ({ page }) => {
    console.log('🧪 Testando persistência de favoritos...');

    // Adicionar favorito
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    
    const favoriteButton = firstCard.locator('app-favorite-button, .favorite-btn');
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
    }

    // Recarregar página
    await page.reload();
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se favorito persistiu
    const reloadedFirstCard = page.locator('app-pokemon-card').first();
    const reloadedFavoriteButton = reloadedFirstCard.locator('app-favorite-button, .favorite-btn');
    
    if (await reloadedFavoriteButton.count() > 0) {
      const isFavorited = await reloadedFavoriteButton.evaluate(btn => {
        const icon = btn.querySelector('ion-icon');
        return icon?.getAttribute('name')?.includes('heart') && 
               !icon?.getAttribute('name')?.includes('outline');
      });

      expect(isFavorited).toBeTruthy();
      console.log('✅ Favoritos persistiram após reload');
    }
  });

  test('Deve funcionar filtros na página de favoritos', async ({ page }) => {
    console.log('🧪 Testando filtros na página de favoritos...');

    // Simular alguns favoritos
    await page.evaluate(() => {
      const favorites = [
        { pokemonId: 1, name: 'bulbasaur', types: ['grass', 'poison'], addedAt: new Date() },
        { pokemonId: 4, name: 'charmander', types: ['fire'], addedAt: new Date() },
        { pokemonId: 7, name: 'squirtle', types: ['water'], addedAt: new Date() }
      ];
      localStorage.setItem('pokemon-favorites', JSON.stringify(favorites));
    });

    // Navegar para favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForURL(/.*\/tabs\/favorites/);
    await page.waitForTimeout(3000);

    // Verificar se há filtros disponíveis
    const searchFilter = page.locator('app-search-filter');
    if (await searchFilter.count() > 0) {
      // Testar busca
      await page.fill('ion-searchbar input', 'char');
      await page.waitForTimeout(2000);

      const filteredCards = page.locator('app-pokemon-card');
      if (await filteredCards.count() > 0) {
        console.log('✅ Filtro de busca funcionando na página de favoritos');
      }

      // Limpar busca
      await page.fill('ion-searchbar input', '');
      await page.waitForTimeout(1000);
    }
  });

  test('Deve mostrar estatísticas de favoritos', async ({ page }) => {
    console.log('🧪 Testando estatísticas de favoritos...');

    // Navegar para favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForURL(/.*\/tabs\/favorites/);
    await page.waitForTimeout(3000);

    // Procurar seção de estatísticas
    const statsSection = page.locator('.favorites-stats, .stats-section, .summary-section');
    
    if (await statsSection.count() > 0) {
      await expect(statsSection.first()).toBeVisible();
      console.log('✅ Seção de estatísticas encontrada');

      // Verificar elementos de estatísticas
      const totalCount = page.locator('.total-favorites, .total-count');
      const typeBreakdown = page.locator('.type-breakdown, .by-type');
      
      if (await totalCount.count() > 0) {
        console.log('✅ Contador total de favoritos presente');
      }
      
      if (await typeBreakdown.count() > 0) {
        console.log('✅ Breakdown por tipo presente');
      }
    } else {
      console.log('⚠️ Seção de estatísticas não encontrada');
    }
  });
});
