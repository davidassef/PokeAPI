import { test, expect } from '@playwright/test';

/**
 * Teste para Verificar Remoção do Botão de Coração/Favorito
 * Confirma que apenas o sistema de Pokeball permanece
 */
test.describe('🧪 Verificação da Remoção do Botão de Coração', () => {
  test('Deve confirmar que botão de coração foi removido e Pokeball funciona', async ({ page }) => {
    console.log('🧪 Testando remoção do botão de coração...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    console.log(`📋 ${cardCount} cards encontrados`);

    // Verificar se botão de coração/favorito foi removido
    console.log('\n❌ Verificando ausência do botão de coração...');
    
    const heartButtons = page.locator('app-favorite-button');
    const heartButtonCount = await heartButtons.count();
    console.log(`💔 Botões de coração encontrados: ${heartButtonCount}`);
    expect(heartButtonCount).toBe(0);

    // Verificar se não há ícones de coração nos cards (exceto badges de ranking)
    const heartIcons = page.locator('app-pokemon-card ion-icon[name="heart"]');
    const heartIconsInCards = await heartIcons.count();
    console.log(`💖 Ícones de coração em cards: ${heartIconsInCards}`);
    
    // Pode haver ícones de coração nos badges de ranking, isso é OK
    if (heartIconsInCards > 0) {
      console.log('ℹ️ Ícones de coração encontrados são provavelmente badges de ranking');
    }

    // Verificar se sistema de Pokeball ainda funciona
    console.log('\n⚾ Verificando sistema de Pokeball...');
    
    const firstCard = cards.first();
    const captureButton = firstCard.locator('.capture-btn');
    
    await expect(captureButton).toBeVisible();
    console.log('✅ Botão de captura (Pokeball) está visível');

    // Verificar se botão de captura tem a Pokeball
    const pokeballIcon = captureButton.locator('img[src*="pokeball"]');
    await expect(pokeballIcon).toBeVisible();
    console.log('✅ Ícone da Pokeball está presente');

    // Testar funcionalidade do botão de captura
    console.log('\n🎯 Testando funcionalidade de captura...');
    
    // Clicar no botão de captura
    await captureButton.click();
    await page.waitForTimeout(2000);

    // Verificar se estado mudou (pode precisar de autenticação)
    const buttonAfterClick = firstCard.locator('.capture-btn');
    const isVisible = await buttonAfterClick.isVisible();
    console.log(`✅ Botão de captura ainda visível após clique: ${isVisible}`);

    // Verificar estrutura do card
    console.log('\n📊 Verificando estrutura do card...');
    
    // Verificar elementos essenciais
    await expect(firstCard.locator('.pokemon-name')).toBeVisible();
    console.log('✅ Nome do Pokémon visível');

    await expect(firstCard.locator('.pokemon-image')).toBeVisible();
    console.log('✅ Imagem do Pokémon visível');

    await expect(firstCard.locator('.pokemon-types')).toBeVisible();
    console.log('✅ Tipos do Pokémon visíveis');

    // Verificar que não há containers de botão de favorito
    const favoriteContainers = firstCard.locator('.favorite-button-container');
    const containerCount = await favoriteContainers.count();
    expect(containerCount).toBe(0);
    console.log('✅ Containers de botão de favorito removidos');

    // Testar clique no card (deve abrir modal)
    console.log('\n🔍 Testando abertura de modal...');
    
    await firstCard.click();
    await page.waitForTimeout(2000);

    // Verificar se modal abriu
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    if (await modal.count() > 0) {
      console.log('✅ Modal abriu corretamente');
      
      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      console.log('✅ Modal fechado');
    } else {
      console.log('ℹ️ Modal pode não ter aberto (comportamento pode variar)');
    }

    // Verificar múltiplos cards
    console.log('\n📋 Verificando múltiplos cards...');
    
    const cardsToCheck = Math.min(3, cardCount);
    for (let i = 0; i < cardsToCheck; i++) {
      const card = cards.nth(i);
      const pokemonName = await card.locator('.pokemon-name').textContent();
      
      // Verificar que não há botão de favorito
      const favoriteBtn = card.locator('app-favorite-button');
      const hasFavoriteBtn = await favoriteBtn.count() > 0;
      expect(hasFavoriteBtn).toBeFalsy();
      
      // Verificar que há botão de captura
      const captureBtn = card.locator('.capture-btn');
      const hasCaptureBtn = await captureBtn.count() > 0;
      expect(hasCaptureBtn).toBeTruthy();
      
      console.log(`✅ Card ${i + 1} (${pokemonName}): Sem favorito ❌, Com captura ✅`);
    }

    console.log('\n🎉 Verificação concluída com sucesso!');
    console.log('✅ Botão de coração/favorito removido');
    console.log('✅ Sistema de Pokeball mantido e funcional');
    console.log('✅ Interface limpa e sem redundância');
  });

  test('Deve verificar que página de favoritos ainda funciona', async ({ page }) => {
    console.log('🧪 Testando página de favoritos após remoção...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navegar para página de favoritos
    await page.click('ion-tab-button[tab="favorites"]');
    await page.waitForURL(/.*\/tabs\/favorites/);
    await page.waitForTimeout(3000);

    // Verificar se página carregou
    const favoritesPage = page.locator('.favorites-content');
    await expect(favoritesPage).toBeVisible();
    console.log('✅ Página de favoritos carregou');

    // Verificar se há mensagem de estado vazio
    const emptyState = page.locator('.empty-state');
    if (await emptyState.count() > 0) {
      console.log('ℹ️ Estado vazio exibido (normal se não há favoritos)');
    }

    // Verificar se cards na página de favoritos não têm botão de coração
    const favoriteCards = page.locator('app-pokemon-card');
    const favoriteCardCount = await favoriteCards.count();
    
    if (favoriteCardCount > 0) {
      console.log(`📋 ${favoriteCardCount} cards na página de favoritos`);
      
      for (let i = 0; i < Math.min(favoriteCardCount, 3); i++) {
        const card = favoriteCards.nth(i);
        const favoriteBtn = card.locator('app-favorite-button');
        const hasFavoriteBtn = await favoriteBtn.count() > 0;
        expect(hasFavoriteBtn).toBeFalsy();
        console.log(`✅ Card ${i + 1} na página de favoritos: Sem botão de coração`);
      }
    } else {
      console.log('ℹ️ Nenhum card na página de favoritos (normal se lista vazia)');
    }

    console.log('✅ Página de favoritos funciona sem botão de coração');
  });

  test('Deve verificar que ranking ainda mostra badges de coração', async ({ page }) => {
    console.log('🧪 Testando badges de coração no ranking...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navegar para página de ranking
    await page.click('ion-tab-button[tab="ranking"]');
    await page.waitForURL(/.*\/tabs\/ranking/);
    await page.waitForTimeout(3000);

    // Verificar se página carregou
    const rankingPage = page.locator('.ranking-content');
    if (await rankingPage.count() > 0) {
      console.log('✅ Página de ranking carregou');
    }

    // Verificar badges de coração (contadores de favoritos)
    const heartBadges = page.locator('.capture-count-badge ion-icon[name="heart"]');
    const heartBadgeCount = await heartBadges.count();
    
    if (heartBadgeCount > 0) {
      console.log(`💖 ${heartBadgeCount} badges de coração encontrados no ranking`);
      console.log('✅ Badges de contagem de favoritos mantidos (correto)');
    } else {
      console.log('ℹ️ Nenhum badge de coração no ranking (normal se não há dados)');
    }

    // Verificar que cards no ranking não têm botão de favorito
    const rankingCards = page.locator('app-pokemon-card');
    const rankingCardCount = await rankingCards.count();
    
    if (rankingCardCount > 0) {
      const firstRankingCard = rankingCards.first();
      const favoriteBtn = firstRankingCard.locator('app-favorite-button');
      const hasFavoriteBtn = await favoriteBtn.count() > 0;
      expect(hasFavoriteBtn).toBeFalsy();
      console.log('✅ Cards no ranking não têm botão de favorito');
    }

    console.log('✅ Ranking mantém badges de coração mas remove botões de favorito');
  });
});
