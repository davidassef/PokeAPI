import { test, expect } from '@playwright/test';

/**
 * Teste específico para verificar se a pokébola de captura está presente no modal de detalhes
 */
test.describe('Teste da Pokébola de Captura no Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:64334/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Deve verificar se a pokébola de captura está presente no modal de detalhes', async ({ page }) => {
    console.log('🧪 Testando presença da pokébola de captura no modal...');

    // Clicar no primeiro card para abrir o modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    console.log('🖱️ Clicou no primeiro card');

    // Aguardar modal abrir
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal abriu corretamente');

    // Aguardar um pouco para o conteúdo carregar
    await page.waitForTimeout(2000);

    // Verificar se existe botão de captura no modal
    const captureButton = modal.locator('.modal-capture-btn');
    const captureButtonExists = await captureButton.count();
    console.log(`🔍 Botões de captura encontrados no modal: ${captureButtonExists}`);

    // Verificar se existe pokébola no modal (imagem)
    const pokeballImage = modal.locator('img[src*="pokeball"], img[alt*="pokeball"], img[alt*="Pokébola"]');
    const pokeballImageExists = await pokeballImage.count();
    console.log(`🔍 Imagens de pokébola encontradas no modal: ${pokeballImageExists}`);

    // Verificar se existe qualquer elemento relacionado à captura
    const captureElements = modal.locator('[class*="capture"], [data-testid*="capture"], button[aria-label*="capture"], button[aria-label*="captur"]');
    const captureElementsExists = await captureElements.count();
    console.log(`🔍 Elementos de captura encontrados no modal: ${captureElementsExists}`);

    // Listar todos os botões no modal para debug
    const allButtons = modal.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`🔍 Total de botões no modal: ${buttonCount}`);

    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const buttonClass = await button.getAttribute('class') || '';
      const buttonAriaLabel = await button.getAttribute('aria-label') || '';
      const buttonText = await button.textContent() || '';
      console.log(`  Botão ${i + 1}: class="${buttonClass}", aria-label="${buttonAriaLabel}", text="${buttonText}"`);
    }

    // Verificar estrutura do modal
    const modalHTML = await modal.innerHTML();
    console.log('📋 Estrutura do modal (primeiros 500 caracteres):');
    console.log(modalHTML.substring(0, 500));

    // Procurar por qualquer referência à pokébola ou captura no HTML
    const hasPokeballReference = modalHTML.includes('pokeball') || modalHTML.includes('Pokébola') || modalHTML.includes('capture') || modalHTML.includes('captur');
    console.log(`🔍 Modal contém referências à pokébola/captura: ${hasPokeballReference}`);

    // Verificar se há botões nos cards (para comparação)
    const cardCaptureButtons = page.locator('app-pokemon-card .capture-btn, app-pokemon-card button[class*="capture"]');
    const cardCaptureButtonsCount = await cardCaptureButtons.count();
    console.log(`🔍 Botões de captura nos cards: ${cardCaptureButtonsCount}`);

    // Resultado do teste
    if (captureButtonExists > 0 || pokeballImageExists > 0 || captureElementsExists > 0) {
      console.log('✅ SUCESSO: Pokébola de captura encontrada no modal!');
    } else {
      console.log('❌ PROBLEMA: Pokébola de captura NÃO encontrada no modal!');
      console.log('💡 Sugestão: Verificar se o botão foi removido do template HTML');
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('🔒 Modal fechado');
  });

  test('Deve verificar se a pokébola está presente nos cards (para comparação)', async ({ page }) => {
    console.log('🧪 Testando presença da pokébola nos cards...');

    // Aguardar cards carregarem
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Verificar botões de captura nos cards
    const cardCaptureButtons = page.locator('app-pokemon-card .capture-btn, app-pokemon-card button[class*="capture"], app-pokemon-card .pokeball');
    const cardCaptureButtonsCount = await cardCaptureButtons.count();
    console.log(`🔍 Botões de captura nos cards: ${cardCaptureButtonsCount}`);

    // Verificar imagens de pokébola nos cards
    const cardPokeballImages = page.locator('app-pokemon-card img[src*="pokeball"], app-pokemon-card img[alt*="pokeball"], app-pokemon-card img[alt*="Pokébola"]');
    const cardPokeballImagesCount = await cardPokeballImages.count();
    console.log(`🔍 Imagens de pokébola nos cards: ${cardPokeballImagesCount}`);

    if (cardCaptureButtonsCount > 0 || cardPokeballImagesCount > 0) {
      console.log('✅ SUCESSO: Pokébolas encontradas nos cards!');
    } else {
      console.log('❌ PROBLEMA: Pokébolas NÃO encontradas nos cards!');
    }
  });
});
