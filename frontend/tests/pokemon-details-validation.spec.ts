import { test, expect } from '@playwright/test';

/**
 * Testes visuais para validação do Details Modal
 * Estes testes verificam se o modal está funcionando corretamente
 * antes e depois da refatoração
 */

test.describe('Pokemon Details Modal - Validação Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('http://localhost:4200');
    
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a página inicial corretamente', async ({ page }) => {
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/PokeAPI/);
    
    // Screenshot da página inicial
    await page.screenshot({ 
      path: 'test-results/01-homepage-loaded.png',
      fullPage: true 
    });
  });

  test('deve abrir o modal de detalhes do Pokémon', async ({ page }) => {
    // Aguardar que os cards de Pokémon apareçam
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    
    // Clicar no primeiro Pokémon
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    
    // Aguardar o modal aparecer
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    // Verificar se o modal está visível
    const modal = page.locator('.details-modal-container');
    await expect(modal).toBeVisible();
    
    // Screenshot do modal aberto
    await page.screenshot({ 
      path: 'test-results/02-modal-opened.png',
      fullPage: true 
    });
  });

  test('deve navegar entre abas do modal', async ({ page }) => {
    // Abrir modal (repetir passos anteriores)
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    // Testar navegação entre abas
    const tabs = ['overview', 'combat', 'evolution', 'curiosities'];
    
    for (const tab of tabs) {
      // Clicar na aba
      const tabButton = page.locator(`[data-tab="${tab}"]`);
      if (await tabButton.count() > 0) {
        await tabButton.click();
        
        // Aguardar conteúdo carregar
        await page.waitForTimeout(1000);
        
        // Screenshot da aba
        await page.screenshot({ 
          path: `test-results/03-tab-${tab}.png`,
          fullPage: true 
        });
      }
    }
  });

  test('deve navegar entre Pokémons no modal', async ({ page }) => {
    // Abrir modal
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    // Obter nome do Pokémon atual
    const currentName = await page.locator('.pokemon-name').textContent();
    
    // Clicar no botão "próximo"
    const nextButton = page.locator('[data-testid="next-pokemon"], .nav-next, .navigation-next');
    if (await nextButton.count() > 0) {
      await nextButton.click();
      
      // Aguardar mudança
      await page.waitForTimeout(2000);
      
      // Verificar se mudou
      const newName = await page.locator('.pokemon-name').textContent();
      expect(newName).not.toBe(currentName);
      
      // Screenshot da navegação
      await page.screenshot({ 
        path: 'test-results/04-navigation-next.png',
        fullPage: true 
      });
    }
  });

  test('deve exibir carrossel de imagens', async ({ page }) => {
    // Abrir modal
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    // Verificar se há imagens no carrossel
    const carouselImages = page.locator('.carousel-image, .pokemon-image');
    if (await carouselImages.count() > 0) {
      // Screenshot do carrossel
      await page.screenshot({ 
        path: 'test-results/05-carousel-images.png',
        fullPage: true 
      });
      
      // Testar navegação no carrossel se houver botões
      const carouselNext = page.locator('.carousel-nav.next, .carousel-next');
      if (await carouselNext.count() > 0) {
        await carouselNext.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: 'test-results/06-carousel-navigation.png',
          fullPage: true 
        });
      }
    }
  });

  test('deve fechar o modal corretamente', async ({ page }) => {
    // Abrir modal
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    // Fechar modal clicando no overlay ou botão fechar
    const closeButton = page.locator('.close-button, .modal-close, [data-testid="close-modal"]');
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Tentar clicar no overlay
      await page.locator('.details-modal-overlay').click();
    }
    
    // Verificar se o modal foi fechado
    await page.waitForTimeout(1000);
    const modal = page.locator('.details-modal-container');
    await expect(modal).not.toBeVisible();
    
    // Screenshot final
    await page.screenshot({ 
      path: 'test-results/07-modal-closed.png',
      fullPage: true 
    });
  });

  test('deve funcionar em diferentes resoluções', async ({ page }) => {
    // Testar em resolução mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'test-results/08-mobile-view.png',
      fullPage: true 
    });
    
    // Testar em resolução desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'test-results/09-desktop-view.png',
      fullPage: true 
    });
  });
});

test.describe('Pokemon Details Modal - Testes de Performance', () => {
  test('deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Tempo de carregamento: ${loadTime}ms`);
    
    // Verificar se carregou em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('deve abrir modal rapidamente', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.pokemon-card', { timeout: 10000 });
    
    const startTime = Date.now();
    
    const firstPokemon = page.locator('.pokemon-card').first();
    await firstPokemon.click();
    await page.waitForSelector('.details-modal-container', { timeout: 5000 });
    
    const modalOpenTime = Date.now() - startTime;
    console.log(`Tempo para abrir modal: ${modalOpenTime}ms`);
    
    // Verificar se abriu em menos de 3 segundos
    expect(modalOpenTime).toBeLessThan(3000);
  });
});
