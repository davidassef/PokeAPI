import { test, expect } from '@playwright/test';

/**
 * Teste de diagnóstico para entender por que o modal não está visível
 */

test.describe('Diagnóstico do Modal', () => {

  test('Diagnóstico: Verificar estado do modal após clique', async ({ page }) => {
    console.log('🔍 Iniciando diagnóstico do modal...');

    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar que os cards sejam carregados
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📋 Cards carregados, clicando no primeiro...');

    // Clicar no primeiro card
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();

    // Aguardar um momento
    await page.waitForTimeout(2000);

    // Verificar se o modal existe
    const modalExists = await page.locator('app-details-modal').count();
    console.log(`📊 Modais encontrados: ${modalExists}`);

    if (modalExists > 0) {
      // Verificar propriedades do modal
      const modal = page.locator('app-details-modal').first();

      const isOpen = await modal.getAttribute('ng-reflect-is-open');
      console.log(`🔓 ng-reflect-is-open: ${isOpen}`);

      const classes = await modal.getAttribute('class');
      console.log(`🎨 Classes: ${classes}`);

      // Verificar CSS computado
      const display = await modal.evaluate(el => getComputedStyle(el).display);
      const visibility = await modal.evaluate(el => getComputedStyle(el).visibility);
      const opacity = await modal.evaluate(el => getComputedStyle(el).opacity);
      const zIndex = await modal.evaluate(el => getComputedStyle(el).zIndex);

      console.log(`🎭 CSS - display: ${display}, visibility: ${visibility}, opacity: ${opacity}, z-index: ${zIndex}`);

      // Verificar se há overlay
      const overlayExists = await page.locator('.modal-overlay, .backdrop, ion-backdrop').count();
      console.log(`🌫️ Overlays encontrados: ${overlayExists}`);

      // Verificar se há conteúdo do modal
      const modalContent = await page.locator('.modal-content, .modal-body, .pokemon-details').count();
      console.log(`📄 Conteúdos do modal encontrados: ${modalContent}`);

      // Verificar conteúdo específico do modal
      const pokemonName = await page.locator('.pokemon-name, .pokemon-title').count();
      const pokemonImage = await page.locator('.pokemon-image, .pokemon-img').count();
      const tabButtons = await page.locator('.tab-btn, .tab-button').count();

      console.log(`🏷️ Nome do Pokémon: ${pokemonName}`);
      console.log(`🖼️ Imagem do Pokémon: ${pokemonImage}`);
      console.log(`📑 Botões de aba: ${tabButtons}`);

      // Verificar se há erros no console
      const logs = await page.evaluate(() => {
        const errors = [];
        const originalError = console.error;
        console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };
        return errors;
      });

      if (logs.length > 0) {
        console.log(`❌ Erros no console: ${logs.join(', ')}`);
      }

      // Tentar forçar visibilidade
      await modal.evaluate(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.zIndex = '9999';
      });

      console.log('🔧 Forçou visibilidade do modal');

      // Aguardar e verificar se agora está visível
      await page.waitForTimeout(1000);
      const isVisible = await modal.isVisible();
      console.log(`👁️ Modal visível após forçar: ${isVisible}`);

      if (isVisible) {
        // Verificar se as abas estão presentes
        const tabs = await page.locator('.tab-btn').count();
        console.log(`📑 Abas encontradas: ${tabs}`);

        if (tabs > 0) {
          const tabTexts = await page.locator('.tab-btn').allTextContents();
          console.log(`📝 Textos das abas: ${tabTexts.join(', ')}`);
        }
      }
    }

    // Tirar screenshot para análise
    await page.screenshot({ path: 'modal-diagnostic.png', fullPage: true });
    console.log('📸 Screenshot salvo como modal-diagnostic.png');

    console.log('✅ Diagnóstico concluído');
  });

  test('Diagnóstico: Verificar roteamento e detecção de dispositivo', async ({ page }) => {
    console.log('🔍 Verificando roteamento...');

    await page.goto('/');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`🌐 URL atual: ${currentUrl}`);

    // Verificar se está na versão web ou mobile
    const isWebVersion = currentUrl.includes('/tabs/');
    const isMobileVersion = currentUrl.includes('/mobile/');

    console.log(`💻 Versão web: ${isWebVersion}`);
    console.log(`📱 Versão mobile: ${isMobileVersion}`);

    // Verificar viewport
    const viewport = page.viewportSize();
    console.log(`📐 Viewport: ${viewport?.width}x${viewport?.height}`);

    // Verificar se há componentes específicos
    const webModal = await page.locator('app-details-modal').count();
    const mobileModal = await page.locator('app-pokemon-details-mobile').count();

    console.log(`🖥️ Modais web encontrados: ${webModal}`);
    console.log(`📱 Modais mobile encontrados: ${mobileModal}`);
  });
});
