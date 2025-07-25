import { test, expect } from '@playwright/test';

/**
 * Testes automatizados para validar o layout do pódio mobile
 * Verifica se o layout corresponde exatamente à versão web
 */
describe('Pódio Mobile - Layout Corrections', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar para a página de ranking mobile
    await page.goto('/mobile/ranking');
    
    // Aguardar carregamento dos dados
    await page.waitForSelector('.ranking-podium-flex-mobile', { timeout: 10000 });
  });

  test('deve exibir o pódio com layout horizontal escalonado', async ({ page }) => {
    // Verificar se o container principal existe
    const podiumContainer = page.locator('.ranking-podium-flex-mobile');
    await expect(podiumContainer).toBeVisible();
    
    // Verificar se tem display flex
    const containerStyles = await podiumContainer.evaluate(el => getComputedStyle(el));
    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.justifyContent).toBe('center');
    expect(containerStyles.alignItems).toBe('flex-end');
  });

  test('deve posicionar o 1º lugar no centro com coroa', async ({ page }) => {
    const firstPlace = page.locator('.podium-card.podium-first');
    await expect(firstPlace).toBeVisible();
    
    // Verificar se tem a coroa
    const crown = firstPlace.locator('.podium-crown.floating');
    await expect(crown).toBeVisible();
    await expect(crown).toHaveText('👑');
    
    // Verificar posicionamento da coroa
    const crownStyles = await crown.evaluate(el => getComputedStyle(el));
    expect(crownStyles.position).toBe('absolute');
    expect(crownStyles.top).toBe('-8px');
    
    // Verificar z-index do card
    const cardStyles = await firstPlace.evaluate(el => getComputedStyle(el));
    expect(cardStyles.zIndex).toBe('3');
  });

  test('deve posicionar o 2º lugar à esquerda com medalha de prata', async ({ page }) => {
    const secondPlace = page.locator('.podium-card.podium-second');
    await expect(secondPlace).toBeVisible();
    
    // Verificar se tem a medalha de prata
    const medal = secondPlace.locator('.podium-medal.floating');
    await expect(medal).toBeVisible();
    await expect(medal).toHaveText('🥈');
    
    // Verificar z-index
    const cardStyles = await secondPlace.evaluate(el => getComputedStyle(el));
    expect(cardStyles.zIndex).toBe('2');
    
    // Verificar altura menor que o 1º lugar
    const firstPlace = page.locator('.podium-card.podium-first');
    const secondHeight = await secondPlace.evaluate(el => el.offsetHeight);
    const firstHeight = await firstPlace.evaluate(el => el.offsetHeight);
    expect(secondHeight).toBeLessThan(firstHeight);
  });

  test('deve posicionar o 3º lugar à direita com medalha de bronze', async ({ page }) => {
    const thirdPlace = page.locator('.podium-card.podium-third');
    await expect(thirdPlace).toBeVisible();
    
    // Verificar se tem a medalha de bronze
    const medal = thirdPlace.locator('.podium-medal.floating');
    await expect(medal).toBeVisible();
    await expect(medal).toHaveText('🥉');
    
    // Verificar z-index
    const cardStyles = await thirdPlace.evaluate(el => getComputedStyle(el));
    expect(cardStyles.zIndex).toBe('1');
    
    // Verificar altura menor que o 2º lugar
    const secondPlace = page.locator('.podium-card.podium-second');
    const thirdHeight = await thirdPlace.evaluate(el => el.offsetHeight);
    const secondHeight = await secondPlace.evaluate(el => el.offsetHeight);
    expect(thirdHeight).toBeLessThan(secondHeight);
  });

  test('deve exibir badges de captura em todos os cards', async ({ page }) => {
    const capturebadges = page.locator('.podium-card .capture-count-badge');
    await expect(capturebadges).toHaveCount(3);
    
    // Verificar se cada badge tem ícone de coração e número
    for (let i = 0; i < 3; i++) {
      const badge = capturebadges.nth(i);
      await expect(badge).toBeVisible();
      
      const heartIcon = badge.locator('ion-icon[name="heart"]');
      await expect(heartIcon).toBeVisible();
      
      // Verificar se tem número de favoritos
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/\d+/);
    }
  });

  test('deve exibir banner de campeão no 1º lugar', async ({ page }) => {
    const firstPlace = page.locator('.podium-card.podium-first');
    const championBanner = firstPlace.locator('.champion-banner');
    
    await expect(championBanner).toBeVisible();
    
    // Verificar posicionamento absoluto
    const bannerStyles = await championBanner.evaluate(el => getComputedStyle(el));
    expect(bannerStyles.position).toBe('absolute');
    expect(bannerStyles.bottom).toBe('-2px');
  });

  test('deve ter efeitos de hover funcionais', async ({ page }) => {
    const firstPlace = page.locator('.podium-card.podium-first');
    
    // Capturar estado inicial
    const initialTransform = await firstPlace.evaluate(el => getComputedStyle(el).transform);
    
    // Fazer hover
    await firstPlace.hover();
    
    // Aguardar transição
    await page.waitForTimeout(500);
    
    // Verificar se transform mudou (efeito hover)
    const hoverTransform = await firstPlace.evaluate(el => getComputedStyle(el).transform);
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('deve ter animação de brilho nas medalhas', async ({ page }) => {
    const medals = page.locator('.podium-medal.floating, .podium-crown.floating');
    
    for (let i = 0; i < await medals.count(); i++) {
      const medal = medals.nth(i);
      
      // Verificar se tem animação CSS
      const animationName = await medal.evaluate(el => getComputedStyle(el).animationName);
      expect(animationName).toBe('glowMedal');
      
      // Verificar duração da animação
      const animationDuration = await medal.evaluate(el => getComputedStyle(el).animationDuration);
      expect(animationDuration).toBe('2s');
    }
  });

  test('deve ter gradientes de fundo corretos', async ({ page }) => {
    // 1º lugar - gradiente dourado
    const firstPlace = page.locator('.podium-card.podium-first');
    const firstBg = await firstPlace.evaluate(el => getComputedStyle(el).background);
    expect(firstBg).toContain('linear-gradient');
    expect(firstBg).toContain('rgb(255, 251, 230)'); // #fffbe6
    
    // 2º lugar - gradiente prateado
    const secondPlace = page.locator('.podium-card.podium-second');
    const secondBg = await secondPlace.evaluate(el => getComputedStyle(el).background);
    expect(secondBg).toContain('linear-gradient');
    expect(secondBg).toContain('rgb(245, 245, 245)'); // #f5f5f5
    
    // 3º lugar - gradiente bronze
    const thirdPlace = page.locator('.podium-card.podium-third');
    const thirdBg = await thirdPlace.evaluate(el => getComputedStyle(el).background);
    expect(thirdBg).toContain('linear-gradient');
    expect(thirdBg).toContain('rgb(255, 243, 224)'); // #fff3e0
  });

  test('deve ter bordas superiores coloridas', async ({ page }) => {
    // 1º lugar - borda dourada
    const firstPlace = page.locator('.podium-card.podium-first');
    const firstBorder = await firstPlace.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(firstBorder).toBe('rgb(255, 215, 0)'); // #ffd700
    
    // 2º lugar - borda prateada
    const secondPlace = page.locator('.podium-card.podium-second');
    const secondBorder = await secondPlace.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(secondBorder).toBe('rgb(192, 192, 192)'); // #c0c0c0
    
    // 3º lugar - borda bronze
    const thirdPlace = page.locator('.podium-card.podium-third');
    const thirdBorder = await thirdPlace.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(thirdBorder).toBe('rgb(205, 127, 50)'); // #cd7f32
  });

  test('deve ter responsividade adequada', async ({ page }) => {
    // Testar em diferentes tamanhos de tela
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Verificar se o pódio ainda está visível e bem posicionado
      const podiumContainer = page.locator('.ranking-podium-flex-mobile');
      await expect(podiumContainer).toBeVisible();
      
      // Verificar se os cards não se sobrepõem inadequadamente
      const cards = page.locator('.podium-card');
      const cardCount = await cards.count();
      expect(cardCount).toBe(3);
      
      // Verificar se todos os cards estão visíveis
      for (let i = 0; i < cardCount; i++) {
        await expect(cards.nth(i)).toBeVisible();
      }
    }
  });

  test('deve permitir interação com os cards', async ({ page }) => {
    // Testar clique no 1º lugar
    const firstPlace = page.locator('.podium-card.podium-first app-pokemon-card');
    await expect(firstPlace).toBeVisible();
    
    // Verificar se é clicável
    await firstPlace.click();
    
    // Aguardar possível modal ou navegação
    await page.waitForTimeout(1000);
    
    // Verificar se houve alguma resposta à interação
    // (pode ser modal, navegação, etc. - depende da implementação)
  });
});

/**
 * Testes de comparação visual com a versão web
 */
describe('Pódio Mobile vs Web - Consistência Visual', () => {
  
  test('deve ter estrutura HTML similar à versão web', async ({ page }) => {
    // Navegar para versão mobile
    await page.goto('/mobile/ranking');
    await page.waitForSelector('.ranking-podium-flex-mobile');
    
    // Verificar estrutura de classes
    const mobileStructure = await page.evaluate(() => {
      const container = document.querySelector('.ranking-podium-flex-mobile');
      return {
        hasContainer: !!container,
        cardCount: container?.querySelectorAll('.podium-card').length || 0,
        hasFirst: !!container?.querySelector('.podium-first'),
        hasSecond: !!container?.querySelector('.podium-second'),
        hasThird: !!container?.querySelector('.podium-third'),
        hasCrowns: container?.querySelectorAll('.podium-crown').length || 0,
        hasMedals: container?.querySelectorAll('.podium-medal').length || 0,
      };
    });
    
    expect(mobileStructure.hasContainer).toBe(true);
    expect(mobileStructure.cardCount).toBe(3);
    expect(mobileStructure.hasFirst).toBe(true);
    expect(mobileStructure.hasSecond).toBe(true);
    expect(mobileStructure.hasThird).toBe(true);
    expect(mobileStructure.hasCrowns).toBe(1);
    expect(mobileStructure.hasMedals).toBe(2);
  });
});
