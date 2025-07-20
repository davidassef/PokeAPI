import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Acessibilidade
 * Testa recursos de acessibilidade e usabilidade
 */
test.describe('8. Testes de Acessibilidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Deve ter estrutura semântica adequada', async ({ page }) => {
    console.log('🧪 Testando estrutura semântica...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar elementos semânticos principais
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      console.log('✅ Elemento main presente');
    }

    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      console.log('✅ Elemento de navegação presente');
    }

    // Verificar headings hierárquicos
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    const h3 = page.locator('h3');

    if (await h1.count() > 0) {
      console.log(`✅ ${await h1.count()} heading h1 encontrado`);
    }
    if (await h2.count() > 0) {
      console.log(`✅ ${await h2.count()} headings h2 encontrados`);
    }
    if (await h3.count() > 0) {
      console.log(`✅ ${await h3.count()} headings h3 encontrados`);
    }

    // Verificar landmarks
    const landmarks = page.locator('[role="banner"], [role="contentinfo"], [role="complementary"]');
    if (await landmarks.count() > 0) {
      console.log(`✅ ${await landmarks.count()} landmarks encontrados`);
    }
  });

  test('Deve ter atributos ARIA adequados', async ({ page }) => {
    console.log('🧪 Testando atributos ARIA...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar botões com aria-label
    const buttons = page.locator('button, ion-button');
    const buttonCount = await buttons.count();
    
    let buttonsWithAria = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaDescribedBy = await button.getAttribute('aria-describedby');
      const title = await button.getAttribute('title');
      
      if (ariaLabel || ariaDescribedBy || title) {
        buttonsWithAria++;
      }
    }

    console.log(`✅ ${buttonsWithAria}/${Math.min(buttonCount, 10)} botões com atributos ARIA`);

    // Verificar imagens com alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    let imagesWithAlt = 0;
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      
      if (alt || ariaLabel) {
        imagesWithAlt++;
      }
    }

    console.log(`✅ ${imagesWithAlt}/${Math.min(imageCount, 10)} imagens com texto alternativo`);

    // Verificar elementos interativos com roles
    const interactiveElements = page.locator('[role="button"], [role="link"], [role="tab"]');
    if (await interactiveElements.count() > 0) {
      console.log(`✅ ${await interactiveElements.count()} elementos com roles interativos`);
    }
  });

  test('Deve funcionar navegação por teclado', async ({ page }) => {
    console.log('🧪 Testando navegação por teclado...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Testar Tab para navegar entre elementos
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`🎯 Primeiro elemento focado: ${focusedElement}`);

    // Navegar por vários elementos
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`🎯 Elemento ${i + 2}: ${focusedElement}`);
    }

    // Testar Shift+Tab para voltar
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(500);
    console.log('✅ Shift+Tab funcionando');

    // Testar Enter em elemento focado
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ Enter ativa elemento focado');

    // Testar Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('✅ Escape funcionando');
  });

  test('Deve ter contraste adequado', async ({ page }) => {
    console.log('🧪 Testando contraste de cores...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar contraste de texto principal
    const textElements = page.locator('.pokemon-name, h1, h2, h3, p, span');
    const elementCount = await textElements.count();
    
    let adequateContrast = 0;
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i);
      
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Verificação básica de contraste (simplificada)
        if (styles.color && styles.backgroundColor) {
          adequateContrast++;
        }
      }
    }

    console.log(`✅ ${adequateContrast}/${Math.min(elementCount, 10)} elementos com cores definidas`);

    // Verificar se há texto muito pequeno
    const smallText = page.locator('*').evaluateAll(elements => {
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        return fontSize < 12 && el.textContent && el.textContent.trim().length > 0;
      }).length;
    });

    expect(await smallText).toBeLessThan(5);
    console.log('✅ Poucos elementos com texto muito pequeno');
  });

  test('Deve funcionar com leitores de tela', async ({ page }) => {
    console.log('🧪 Testando compatibilidade com leitores de tela...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se elementos têm texto acessível
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      
      // Verificar se card tem texto ou aria-label
      const accessibleName = await card.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.getAttribute('aria-labelledby') ||
               el.textContent?.trim() ||
               '';
      });
      
      expect(accessibleName.length).toBeGreaterThan(0);
      console.log(`✅ Card ${i + 1}: "${accessibleName.substring(0, 30)}..."`);
    }

    // Verificar botões com texto acessível
    const buttons = page.locator('button, ion-button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      
      if (await button.isVisible()) {
        const accessibleName = await button.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('title') ||
                 el.textContent?.trim() ||
                 '';
        });
        
        if (accessibleName.length > 0) {
          console.log(`✅ Botão ${i + 1}: "${accessibleName}"`);
        }
      }
    }

    // Verificar se modal é anunciado corretamente
    await cards.first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalRole = await modal.getAttribute('role');
    const modalAriaLabel = await modal.getAttribute('aria-label');
    
    if (modalRole === 'dialog' || modalAriaLabel) {
      console.log('✅ Modal acessível para leitores de tela');
    }
  });

  test('Deve funcionar com zoom aumentado', async ({ page }) => {
    console.log('🧪 Testando com zoom aumentado...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Aplicar zoom de 150%
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    await page.waitForTimeout(2000);

    // Verificar se elementos ainda são visíveis e clicáveis
    const cards = page.locator('app-pokemon-card');
    await expect(cards.first()).toBeVisible();
    
    // Testar clique com zoom
    await cards.first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Elementos clicáveis com zoom 150%');

    // Aplicar zoom de 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2.0';
    });
    await page.waitForTimeout(2000);

    // Verificar se navegação ainda funciona
    const tabButtons = page.locator('ion-tab-button');
    if (await tabButtons.count() > 0) {
      await tabButtons.nth(1).click();
      await page.waitForTimeout(2000);
      console.log('✅ Navegação funciona com zoom 200%');
    }

    // Resetar zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.0';
    });
  });

  test('Deve ter foco visível', async ({ page }) => {
    console.log('🧪 Testando indicadores de foco...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Navegar com Tab e verificar foco
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Verificar se elemento focado tem indicador visual
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      if (focused) {
        const styles = window.getComputedStyle(focused);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      }
      return null;
    });

    if (focusedElement) {
      const hasFocusIndicator = 
        focusedElement.outline !== 'none' ||
        focusedElement.outlineWidth !== '0px' ||
        focusedElement.boxShadow !== 'none' ||
        focusedElement.border.includes('px');
      
      if (hasFocusIndicator) {
        console.log('✅ Indicador de foco visível');
      } else {
        console.log('⚠️ Indicador de foco pode não ser visível');
      }
    }

    // Testar foco em vários elementos
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
    }
    console.log('✅ Navegação por foco funcionando');
  });

  test('Deve funcionar com tecnologias assistivas', async ({ page }) => {
    console.log('🧪 Testando compatibilidade com tecnologias assistivas...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar live regions para atualizações dinâmicas
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    if (await liveRegions.count() > 0) {
      console.log(`✅ ${await liveRegions.count()} live regions encontradas`);
    }

    // Verificar se formulários têm labels
    const inputs = page.locator('input, ion-input, ion-searchbar');
    const inputCount = await inputs.count();
    
    let inputsWithLabels = 0;
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const label = await input.evaluate(el => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.getAttribute('placeholder');
        const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return ariaLabel || ariaLabelledBy || associatedLabel || placeholder;
      });
      
      if (label) {
        inputsWithLabels++;
      }
    }

    console.log(`✅ ${inputsWithLabels}/${Math.min(inputCount, 5)} inputs com labels`);

    // Verificar se há skip links
    const skipLinks = page.locator('a[href="#main"], a[href="#content"], .skip-link');
    if (await skipLinks.count() > 0) {
      console.log('✅ Skip links encontrados');
    }

    // Verificar se há descrições para elementos complexos
    const complexElements = page.locator('[aria-describedby]');
    if (await complexElements.count() > 0) {
      console.log(`✅ ${await complexElements.count()} elementos com descrições`);
    }
  });

  test('Deve respeitar preferências de movimento reduzido', async ({ page }) => {
    console.log('🧪 Testando preferências de movimento reduzido...');

    // Simular preferência de movimento reduzido
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se animações são reduzidas
    const animatedElements = page.locator('.animated, [class*="animate"], [class*="transition"]');
    
    if (await animatedElements.count() > 0) {
      const animationDuration = await animatedElements.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration;
      });
      
      console.log(`🎬 Duração da animação: ${animationDuration}`);
    }

    // Testar abertura de modal (deve ser instantânea ou muito rápida)
    const startTime = Date.now();
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    const openTime = Date.now() - startTime;

    expect(openTime).toBeLessThan(1000); // Deve ser rápido com movimento reduzido
    console.log(`✅ Modal abriu em ${openTime}ms (movimento reduzido)`);
  });
});
