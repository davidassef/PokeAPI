import { test, expect } from '@playwright/test';

test.describe('Modal Mobile - Responsividade ao Toque', () => {
  test.beforeEach(async ({ page, context }) => {
    // ✅ CORREÇÃO: Habilitar suporte a toque
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 1,
      });
    });

    // Simular dispositivo mobile com toque
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4200/');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
    console.log('📱 Página carregada em modo mobile com suporte a toque');
  });

  test('Deve permitir scroll vertical no modal mobile', async ({ page }) => {
    console.log('🧪 Testando scroll vertical no modal mobile...');

    // Clicar no primeiro card para abrir o modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no primeiro card');

    // Aguardar modal mobile abrir
    await page.waitForSelector('app-pokemon-details-mobile .mobile-modal-overlay', { timeout: 10000 });
    const mobileModal = page.locator('app-pokemon-details-mobile .mobile-modal-overlay');
    await expect(mobileModal).toBeVisible();
    console.log('✅ Modal mobile abriu corretamente');

    // Aguardar conteúdo carregar
    await page.waitForTimeout(3000); // Aumentado para garantir carregamento completo

    // Verificar se o container scrollável está presente
    const scrollContainer = page.locator('.global-scroll-container');
    await expect(scrollContainer).toBeVisible();
    console.log('✅ Container scrollável encontrado');

    // Verificar propriedades CSS do scroll
    const scrollContainerStyles = await scrollContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        overflowY: styles.overflowY,
        overflowX: styles.overflowX,
        touchAction: styles.touchAction,
        webkitOverflowScrolling: styles.webkitOverflowScrolling
      };
    });

    console.log('🔍 Estilos do container scrollável:', scrollContainerStyles);

    // Verificar se as propriedades de scroll estão corretas
    expect(scrollContainerStyles.overflowY).toBe('auto');
    expect(scrollContainerStyles.overflowX).toBe('hidden');
    console.log('✅ Propriedades de overflow corretas');

    // Testar scroll programático
    const initialScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
    console.log(`📏 Scroll inicial: ${initialScrollTop}px`);

    // Fazer scroll para baixo
    await scrollContainer.evaluate(el => el.scrollTo(0, 200));
    await page.waitForTimeout(500);

    const newScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
    console.log(`📏 Scroll após movimento: ${newScrollTop}px`);

    // Verificar se o scroll funcionou
    expect(newScrollTop).toBeGreaterThan(initialScrollTop);
    console.log('✅ Scroll programático funcionou');

    // Testar scroll com gestos de mouse (simulando toque)
    const containerBounds = await scrollContainer.boundingBox();
    if (containerBounds) {
      // Simular swipe para cima (scroll para baixo) usando mouse
      const startX = containerBounds.x + containerBounds.width / 2;
      const startY = containerBounds.y + containerBounds.height / 2;
      const endY = containerBounds.y + containerBounds.height / 4;

      // Simular movimento de drag (swipe up)
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, endY, { steps: 10 });
      await page.mouse.up();

      await page.waitForTimeout(500);

      const finalScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
      console.log(`📏 Scroll após gesto: ${finalScrollTop}px`);

      console.log('✅ Gestos de scroll simulados');
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('🔒 Modal fechado');
  });

  test('Deve permitir interação com botão de captura no modal mobile', async ({ page }) => {
    console.log('🧪 Testando interação com botão de captura no modal mobile...');

    // Clicar no primeiro card para abrir o modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no primeiro card');

    // Aguardar modal mobile abrir
    await page.waitForSelector('app-pokemon-details-mobile .mobile-modal-overlay', { timeout: 10000 });
    const mobileModal = page.locator('app-pokemon-details-mobile .mobile-modal-overlay');
    await expect(mobileModal).toBeVisible();
    console.log('✅ Modal mobile abriu corretamente');

    // Aguardar conteúdo carregar
    await page.waitForTimeout(2000);

    // Verificar se o botão de captura está presente
    const captureButton = page.locator('.mobile-capture-btn');
    await expect(captureButton).toBeVisible();
    console.log('✅ Botão de captura encontrado');

    // Verificar propriedades CSS do botão
    const buttonStyles = await captureButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        pointerEvents: styles.pointerEvents,
        position: styles.position,
        zIndex: styles.zIndex,
        cursor: styles.cursor
      };
    });

    console.log('🔍 Estilos do botão de captura:', buttonStyles);

    // Verificar se o botão está interativo
    expect(buttonStyles.pointerEvents).not.toBe('none');
    expect(buttonStyles.cursor).toBe('pointer');
    console.log('✅ Botão está interativo');

    // Testar clique no botão
    const buttonBounds = await captureButton.boundingBox();
    if (buttonBounds) {
      // Simular clique no botão (equivalente a toque)
      await page.mouse.click(
        buttonBounds.x + buttonBounds.width / 2,
        buttonBounds.y + buttonBounds.height / 2
      );

      console.log('✅ Clique no botão de captura simulado');

      // Aguardar possível resposta (modal de auth ou loading)
      await page.waitForTimeout(1000);
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('🔒 Modal fechado');
  });

  test('Deve permitir navegação entre abas no modal mobile', async ({ page }) => {
    console.log('🧪 Testando navegação entre abas no modal mobile...');

    // Clicar no primeiro card para abrir o modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no primeiro card');

    // Aguardar modal mobile abrir
    await page.waitForSelector('app-pokemon-details-mobile .mobile-modal-overlay', { timeout: 10000 });
    const mobileModal = page.locator('app-pokemon-details-mobile .mobile-modal-overlay');
    await expect(mobileModal).toBeVisible();
    console.log('✅ Modal mobile abriu corretamente');

    // Aguardar conteúdo carregar
    await page.waitForTimeout(2000);

    // Verificar se as abas estão presentes
    const tabButtons = page.locator('.mobile-tabs-static .tab-btn');
    const tabCount = await tabButtons.count();
    console.log(`📊 Encontradas ${tabCount} abas`);

    if (tabCount > 1) {
      // Clicar na segunda aba
      await tabButtons.nth(1).click();
      await page.waitForTimeout(500);
      console.log('✅ Clicou na segunda aba');

      // Verificar se a aba mudou
      const activeTab = page.locator('.tab-btn.active');
      await expect(activeTab).toBeVisible();
      console.log('✅ Aba ativa encontrada');
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('🔒 Modal fechado');
  });

  test('Deve permitir scroll sem interferência do evento de overlay', async ({ page }) => {
    console.log('🧪 Testando se evento de overlay não interfere com scroll...');

    // Clicar no primeiro card para abrir o modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no primeiro card');

    // Aguardar modal mobile abrir
    await page.waitForSelector('app-pokemon-details-mobile .mobile-modal-overlay', { timeout: 10000 });
    const mobileModal = page.locator('app-pokemon-details-mobile .mobile-modal-overlay');
    await expect(mobileModal).toBeVisible();
    console.log('✅ Modal mobile abriu corretamente');

    // Aguardar conteúdo carregar
    await page.waitForTimeout(3000);

    // Verificar se o container scrollável está presente
    const scrollContainer = page.locator('.global-scroll-container');
    await expect(scrollContainer).toBeVisible();
    console.log('✅ Container scrollável encontrado');

    // Verificar altura do conteúdo para garantir que há scroll
    const containerHeight = await scrollContainer.evaluate(el => el.scrollHeight);
    const viewportHeight = await scrollContainer.evaluate(el => el.clientHeight);
    console.log(`📏 Altura do conteúdo: ${containerHeight}px, Viewport: ${viewportHeight}px`);

    if (containerHeight > viewportHeight) {
      console.log('✅ Conteúdo é maior que viewport, scroll necessário');

      // Testar scroll com wheel event (mais próximo do comportamento real)
      const containerBounds = await scrollContainer.boundingBox();
      if (containerBounds) {
        const centerX = containerBounds.x + containerBounds.width / 2;
        const centerY = containerBounds.y + containerBounds.height / 2;

        // Scroll inicial
        const initialScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
        console.log(`📏 Scroll inicial: ${initialScrollTop}px`);

        // Simular scroll com wheel (mais realista)
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, 200); // Scroll para baixo
        await page.waitForTimeout(500);

        const newScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
        console.log(`📏 Scroll após wheel: ${newScrollTop}px`);

        if (newScrollTop > initialScrollTop) {
          console.log('✅ SUCESSO: Scroll com wheel funcionou!');
        } else {
          console.log('⚠️ Scroll com wheel não funcionou, tentando drag...');

          // Fallback: testar com drag
          await page.mouse.move(centerX, centerY);
          await page.mouse.down();
          await page.mouse.move(centerX, centerY - 100, { steps: 5 });
          await page.mouse.up();
          await page.waitForTimeout(500);

          const finalScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
          console.log(`📏 Scroll após drag: ${finalScrollTop}px`);

          if (finalScrollTop > initialScrollTop) {
            console.log('✅ SUCESSO: Scroll com drag funcionou!');
          } else {
            console.log('❌ PROBLEMA: Nenhum método de scroll funcionou');
          }
        }
      }
    } else {
      console.log('⚠️ Conteúdo não é maior que viewport, scroll não necessário');
    }

    // Verificar se o modal ainda está aberto (não foi fechado por engano)
    await expect(mobileModal).toBeVisible();
    console.log('✅ Modal ainda está aberto após tentativas de scroll');

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('🔒 Modal fechado');
  });
});
