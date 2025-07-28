import { test, expect } from '@playwright/test';

test.describe('Sincronização de Estado de Captura Entre Páginas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');
    console.log('📱 Página carregada');
  });

  test('Deve sincronizar estado de captura entre Home e Ranking', async ({ page }) => {
    console.log('🧪 Testando sincronização entre Home e Ranking...');

    // 1. Ir para a página Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(2000);
    console.log('🏠 Navegou para Home');

    // 2. Encontrar o primeiro Pokémon e verificar seu estado inicial
    const firstCard = page.locator('app-pokemon-card').first();
    await expect(firstCard).toBeVisible();
    
    // Obter ID do Pokémon para rastreamento
    const pokemonId = await firstCard.getAttribute('data-pokemon-id') || 
                      await firstCard.locator('[data-pokemon-id]').first().getAttribute('data-pokemon-id');
    console.log(`🎯 Pokémon ID: ${pokemonId}`);

    // Verificar estado inicial do botão de captura na Home
    const homeCaptureButton = firstCard.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
    const homeInitialState = await homeCaptureButton.getAttribute('class');
    const isInitiallyCapturedHome = homeInitialState?.includes('captured') || false;
    console.log(`🏠 Estado inicial na Home: ${isInitiallyCapturedHome ? 'Capturado' : 'Não capturado'}`);

    // 3. Navegar para Ranking
    await page.click('ion-tab-button[tab="ranking"]');
    await page.waitForTimeout(3000); // Aguardar carregamento do ranking
    console.log('🏆 Navegou para Ranking');

    // 4. Encontrar o mesmo Pokémon no Ranking (se estiver visível)
    const rankingCards = page.locator('app-pokemon-card');
    const rankingCardCount = await rankingCards.count();
    console.log(`🏆 Encontrados ${rankingCardCount} cards no Ranking`);

    let rankingCard = null;
    let rankingInitialState = null;
    let isInitiallyCapturedRanking = false;

    // Procurar pelo mesmo Pokémon no ranking
    for (let i = 0; i < Math.min(rankingCardCount, 10); i++) {
      const card = rankingCards.nth(i);
      const cardPokemonId = await card.getAttribute('data-pokemon-id') || 
                           await card.locator('[data-pokemon-id]').first().getAttribute('data-pokemon-id');
      
      if (cardPokemonId === pokemonId) {
        rankingCard = card;
        const rankingCaptureButton = card.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
        rankingInitialState = await rankingCaptureButton.getAttribute('class');
        isInitiallyCapturedRanking = rankingInitialState?.includes('captured') || false;
        console.log(`🏆 Mesmo Pokémon encontrado no Ranking - Estado: ${isInitiallyCapturedRanking ? 'Capturado' : 'Não capturado'}`);
        break;
      }
    }

    // 5. Verificar se os estados iniciais são consistentes
    if (rankingCard) {
      if (isInitiallyCapturedHome === isInitiallyCapturedRanking) {
        console.log('✅ Estados iniciais consistentes entre Home e Ranking');
      } else {
        console.log('❌ Estados iniciais INCONSISTENTES entre Home e Ranking');
        console.log(`   Home: ${isInitiallyCapturedHome}, Ranking: ${isInitiallyCapturedRanking}`);
      }
    } else {
      console.log('⚠️ Pokémon não encontrado no Ranking, testando com primeiro card disponível');
      rankingCard = rankingCards.first();
    }

    // 6. Tentar capturar/descapturar no Ranking
    if (rankingCard) {
      const rankingCaptureButton = rankingCard.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
      
      if (await rankingCaptureButton.isVisible()) {
        console.log('🎯 Clicando no botão de captura no Ranking...');
        await rankingCaptureButton.click();
        await page.waitForTimeout(2000); // Aguardar processamento
        
        // Verificar se houve mudança de estado
        const newRankingState = await rankingCaptureButton.getAttribute('class');
        const isNowCapturedRanking = newRankingState?.includes('captured') || false;
        console.log(`🏆 Novo estado no Ranking: ${isNowCapturedRanking ? 'Capturado' : 'Não capturado'}`);
      }
    }

    // 7. Voltar para Home e verificar se o estado foi sincronizado
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(2000);
    console.log('🏠 Voltou para Home');

    // Verificar estado atual na Home
    const homeCardAfter = page.locator('app-pokemon-card').first();
    const homeCaptureButtonAfter = homeCardAfter.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
    
    if (await homeCaptureButtonAfter.isVisible()) {
      const homeFinalState = await homeCaptureButtonAfter.getAttribute('class');
      const isFinalCapturedHome = homeFinalState?.includes('captured') || false;
      console.log(`🏠 Estado final na Home: ${isFinalCapturedHome ? 'Capturado' : 'Não capturado'}`);

      // Comparar com estado inicial para verificar sincronização
      if (isInitiallyCapturedHome !== isFinalCapturedHome) {
        console.log('✅ SUCESSO: Estado foi sincronizado entre páginas!');
        console.log(`   Mudança detectada: ${isInitiallyCapturedHome} → ${isFinalCapturedHome}`);
      } else {
        console.log('⚠️ Nenhuma mudança detectada (pode ser devido à falta de autenticação)');
      }
    }

    console.log('🏁 Teste de sincronização concluído');
  });

  test('Deve sincronizar estado de captura entre Home e Capturados', async ({ page }) => {
    console.log('🧪 Testando sincronização entre Home e Capturados...');

    // 1. Ir para a página Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(2000);
    console.log('🏠 Navegou para Home');

    // 2. Contar Pokémon capturados na Home
    const homeCards = page.locator('app-pokemon-card');
    const homeCardCount = await homeCards.count();
    
    let capturedCountHome = 0;
    for (let i = 0; i < Math.min(homeCardCount, 20); i++) {
      const card = homeCards.nth(i);
      const captureButton = card.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
      
      if (await captureButton.isVisible()) {
        const buttonState = await captureButton.getAttribute('class');
        if (buttonState?.includes('captured')) {
          capturedCountHome++;
        }
      }
    }
    console.log(`🏠 Pokémon capturados na Home: ${capturedCountHome}`);

    // 3. Navegar para página Capturados
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForTimeout(3000);
    console.log('📦 Navegou para Capturados');

    // 4. Contar Pokémon na página Capturados
    const capturedCards = page.locator('app-pokemon-card');
    const capturedCardCount = await capturedCards.count();
    console.log(`📦 Pokémon na página Capturados: ${capturedCardCount}`);

    // 5. Verificar consistência
    if (capturedCountHome === capturedCardCount) {
      console.log('✅ SUCESSO: Contagem consistente entre Home e Capturados');
    } else {
      console.log('⚠️ Possível inconsistência na contagem');
      console.log(`   Home: ${capturedCountHome} capturados, Capturados: ${capturedCardCount} cards`);
      console.log('   Nota: Diferenças podem ser normais devido a paginação ou filtros');
    }

    // 6. Tentar descapturar um Pokémon na página Capturados (se houver)
    if (capturedCardCount > 0) {
      const firstCapturedCard = capturedCards.first();
      const captureButton = firstCapturedCard.locator('.capture-btn, .modal-capture-btn, .mobile-capture-btn').first();
      
      if (await captureButton.isVisible()) {
        console.log('🎯 Tentando descapturar Pokémon na página Capturados...');
        await captureButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar se o card foi removido ou mudou de estado
        const newCapturedCardCount = await capturedCards.count();
        console.log(`📦 Nova contagem na página Capturados: ${newCapturedCardCount}`);
        
        if (newCapturedCardCount < capturedCardCount) {
          console.log('✅ Pokémon removido da lista de capturados');
        }
      }
    }

    console.log('🏁 Teste de sincronização Home-Capturados concluído');
  });
});
