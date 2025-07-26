import { test, expect } from '@playwright/test';

/**
 * Testes específicos para o problema das imagens do carrossel no modal mobile
 * Reportado: imagens não mudam apesar da descrição e carrossel andarem
 */

test.describe('Modal Mobile - Carrossel de Imagens', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar para a aplicação
    await page.goto('http://localhost:8100');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Fazer login se necessário
    const loginButton = page.locator('ion-button:has-text("Entrar")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'teste@teste.com');
      await page.fill('input[type="password"]', 'Teste123');
      await page.click('ion-button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
  });

  test('deve trocar imagens corretamente no carrossel mobile', async ({ page }) => {
    console.log('🧪 Testando troca de imagens no carrossel mobile');
    
    // Encontrar e clicar em um pokémon para abrir o modal
    const pokemonCard = page.locator('.pokemon-card').first();
    await pokemonCard.waitFor({ state: 'visible' });
    await pokemonCard.click();
    
    // Aguardar modal mobile abrir
    const mobileModal = page.locator('.mobile-modal-overlay');
    await mobileModal.waitFor({ state: 'visible' });
    
    // Aguardar carregamento das imagens
    await page.waitForTimeout(2000);
    
    // Verificar se há múltiplas imagens no carrossel
    const carouselImages = page.locator('.carousel-nav');
    const imageCount = await carouselImages.count();
    
    if (imageCount > 0) {
      console.log(`📊 Encontradas ${imageCount} imagens no carrossel`);
      
      // Capturar imagem inicial
      const mainImage = page.locator('.pokemon-image');
      await mainImage.waitFor({ state: 'visible' });
      
      const initialSrc = await mainImage.getAttribute('src');
      console.log(`🖼️ Imagem inicial: ${initialSrc}`);
      
      // Clicar no botão "próxima imagem"
      const nextButton = page.locator('.carousel-nav.next');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Aguardar transição
        await page.waitForTimeout(1000);
        
        // Verificar se a imagem mudou
        const newSrc = await mainImage.getAttribute('src');
        console.log(`🖼️ Nova imagem: ${newSrc}`);
        
        // Verificar se as imagens são diferentes
        expect(newSrc).not.toBe(initialSrc);
        console.log('✅ Imagem mudou corretamente');
        
        // Testar botão anterior
        const prevButton = page.locator('.carousel-nav.prev');
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
          
          const backSrc = await mainImage.getAttribute('src');
          expect(backSrc).toBe(initialSrc);
          console.log('✅ Botão anterior funciona corretamente');
        }
      } else {
        console.log('⚠️ Apenas uma imagem disponível no carrossel');
      }
    } else {
      console.log('⚠️ Nenhuma imagem encontrada no carrossel');
    }
    
    // Fechar modal
    const closeButton = page.locator('.close-button');
    await closeButton.click();
  });

  test('deve sincronizar índice do carrossel com imagem exibida', async ({ page }) => {
    console.log('🧪 Testando sincronização do índice do carrossel');
    
    // Abrir modal mobile
    const pokemonCard = page.locator('.pokemon-card').first();
    await pokemonCard.click();
    
    const mobileModal = page.locator('.mobile-modal-overlay');
    await mobileModal.waitFor({ state: 'visible' });
    await page.waitForTimeout(2000);
    
    // Verificar se currentCarouselIndex está sendo atualizado
    const carouselIndex = await page.evaluate(() => {
      const component = (window as any).ng?.getComponent?.(document.querySelector('app-pokemon-details-mobile'));
      return component?.currentCarouselIndex;
    });
    
    console.log(`📊 Índice inicial do carrossel: ${carouselIndex}`);
    
    // Navegar no carrossel e verificar sincronização
    const nextButton = page.locator('.carousel-nav.next');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      const newIndex = await page.evaluate(() => {
        const component = (window as any).ng?.getComponent?.(document.querySelector('app-pokemon-details-mobile'));
        return component?.currentCarouselIndex;
      });
      
      console.log(`📊 Novo índice do carrossel: ${newIndex}`);
      expect(newIndex).not.toBe(carouselIndex);
    }
  });

  test('deve carregar imagens válidas no carrossel', async ({ page }) => {
    console.log('🧪 Testando carregamento de imagens válidas');
    
    // Abrir modal mobile
    const pokemonCard = page.locator('.pokemon-card').first();
    await pokemonCard.click();
    
    const mobileModal = page.locator('.mobile-modal-overlay');
    await mobileModal.waitFor({ state: 'visible' });
    await page.waitForTimeout(2000);
    
    // Verificar se a imagem principal carregou
    const mainImage = page.locator('.pokemon-image');
    await mainImage.waitFor({ state: 'visible' });
    
    // Verificar se não há placeholder de erro
    const errorPlaceholder = page.locator('.image-placeholder');
    const hasError = await errorPlaceholder.isVisible();
    
    if (hasError) {
      console.log('❌ Imagem não carregou - placeholder de erro visível');
    } else {
      console.log('✅ Imagem carregou corretamente');
    }
    
    expect(hasError).toBe(false);
  });

});
