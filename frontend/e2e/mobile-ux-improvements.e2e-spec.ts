import { browser, by, element, ExpectedConditions as EC } from 'protractor';

/**
 * Testes E2E para validar as melhorias de UX mobile implementadas
 * Foca na correção de pointer-events, navegação e layout responsivo
 */
describe('Mobile UX Improvements E2E Tests', () => {
  const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE dimensions

  beforeEach(async () => {
    await browser.manage().window().setSize(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    await browser.get('/mobile/home');
    await browser.wait(EC.presenceOf(element(by.css('.pokemon-grid-mobile'))), 10000);
  });

  describe('🔧 Correção de Pointer Events nas Abas', () => {
    it('should allow clicking on mobile tabs without interference', async () => {
      // Verificar se conseguimos clicar na aba Capturados
      const capturedTab = element(by.css('ion-tab-button[tab="captured"]'));
      await browser.wait(EC.elementToBeClickable(capturedTab), 5000);
      
      await capturedTab.click();
      
      // Verificar se navegou corretamente
      await browser.wait(EC.urlContains('/mobile/captured'), 5000);
      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).toContain('/mobile/captured');
    });

    it('should navigate between all mobile tabs successfully', async () => {
      const tabs = [
        { selector: 'ion-tab-button[tab="captured"]', expectedUrl: '/mobile/captured' },
        { selector: 'ion-tab-button[tab="ranking"]', expectedUrl: '/mobile/ranking' },
        { selector: 'ion-tab-button[tab="settings"]', expectedUrl: '/mobile/settings' },
        { selector: 'ion-tab-button[tab="home"]', expectedUrl: '/mobile/home' }
      ];

      for (const tab of tabs) {
        const tabElement = element(by.css(tab.selector));
        await browser.wait(EC.elementToBeClickable(tabElement), 5000);
        
        await tabElement.click();
        
        await browser.wait(EC.urlContains(tab.expectedUrl), 5000);
        const currentUrl = await browser.getCurrentUrl();
        expect(currentUrl).toContain(tab.expectedUrl);
      }
    });

    it('should not have icon interference with tab clicks', async () => {
      // Verificar se os ícones não estão bloqueando cliques
      const tabIcons = element.all(by.css('ion-tab-button ion-icon'));
      const iconCount = await tabIcons.count();
      expect(iconCount).toBeGreaterThan(0);

      // Tentar clicar diretamente no ícone (deve funcionar devido ao pointer-events: none)
      const firstIcon = tabIcons.first();
      const parentTab = element(by.xpath('//ion-icon/ancestor::ion-tab-button[1]'));
      
      await firstIcon.click();
      
      // Verificar se o clique foi processado pelo elemento pai (tab)
      const href = await parentTab.getAttribute('href');
      expect(href).toBeTruthy();
    });
  });

  describe('📱 Melhorias de Layout e Espaçamento', () => {
    it('should have improved spacing in pokemon grid', async () => {
      const pokemonGrid = element(by.css('.pokemon-grid-mobile'));
      await browser.wait(EC.presenceOf(pokemonGrid), 5000);

      // Verificar se o grid tem o gap adequado
      const gridStyle = await pokemonGrid.getCssValue('gap');
      const gapValue = parseInt(gridStyle);
      expect(gapValue).toBeGreaterThanOrEqual(12); // Gap deve ser >= 12px
    });

    it('should have proper container padding', async () => {
      const pageContainer = element(by.css('.page-container-mobile'));
      await browser.wait(EC.presenceOf(pageContainer), 5000);

      const paddingStyle = await pageContainer.getCssValue('padding');
      // Verificar se o padding foi aumentado (deve conter valores >= 12px)
      expect(paddingStyle).toMatch(/1[2-9]px|[2-9]\dpx/); // 12px ou maior
    });

    it('should have improved pagination button sizes', async () => {
      const paginationBtns = element.all(by.css('.pagination-btn'));
      const btnCount = await paginationBtns.count();
      
      if (btnCount > 0) {
        const firstBtn = paginationBtns.first();
        const minWidth = await firstBtn.getCssValue('min-width');
        const minHeight = await firstBtn.getCssValue('min-height');
        
        expect(parseInt(minWidth)).toBeGreaterThanOrEqual(48); // >= 48px
        expect(parseInt(minHeight)).toBeGreaterThanOrEqual(42); // >= 42px
      }
    });
  });

  describe('🎯 Modal de Detalhes Mobile', () => {
    beforeEach(async () => {
      // Abrir modal de detalhes
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await browser.wait(EC.presenceOf(pokemonCards.first()), 10000);
      await pokemonCards.first().click();
      
      await browser.wait(EC.presenceOf(element(by.css('app-pokemon-details-mobile'))), 5000);
    });

    it('should display correct carousel counter format', async () => {
      // Verificar se o contador do carrossel está no formato correto
      const carouselCounter = element(by.css('.carousel-counter, .image-counter'));
      
      if (await carouselCounter.isPresent()) {
        const counterText = await carouselCounter.getText();
        // Deve estar no formato (1/8) e não ({currentIndex}/{total})
        expect(counterText).toMatch(/\(\d+\/\d+\)/);
        expect(counterText).not.toContain('{');
        expect(counterText).not.toContain('}');
      }
    });

    it('should not have duplicate ability badges', async () => {
      // Navegar para a aba Stats
      const statsTab = element(by.css('.tab-btn[ng-reflect-ng-class*="combat"], button[role="tab"]:contains("Stats")'));
      if (await statsTab.isPresent()) {
        await statsTab.click();
        await browser.sleep(1000); // Aguardar transição
      }

      // Verificar habilidades
      const abilityBadges = element.all(by.css('.ability-badge'));
      const badgeCount = await abilityBadges.count();
      
      // Deve ter no máximo 1 badge por habilidade oculta
      if (badgeCount > 0) {
        const badgeTexts = await abilityBadges.map(badge => badge.getText());
        const hiddenAbilityBadges = badgeTexts.filter(text => 
          text.includes('Oculta') || text.includes('Hidden')
        );
        
        // Não deve ter badges duplicados para a mesma habilidade
        const uniqueBadges = [...new Set(hiddenAbilityBadges)];
        expect(hiddenAbilityBadges.length).toBe(uniqueBadges.length);
      }
    });

    it('should have improved ability card styling', async () => {
      // Navegar para a aba Stats se necessário
      const statsTab = element(by.css('.tab-btn[ng-reflect-ng-class*="combat"], button[role="tab"]:contains("Stats")'));
      if (await statsTab.isPresent()) {
        await statsTab.click();
        await browser.sleep(1000);
      }

      const abilityCards = element.all(by.css('.ability-card'));
      const cardCount = await abilityCards.count();
      
      if (cardCount > 0) {
        const firstCard = abilityCards.first();
        
        // Verificar border-radius melhorado
        const borderRadius = await firstCard.getCssValue('border-radius');
        expect(parseInt(borderRadius)).toBeGreaterThanOrEqual(12);
        
        // Verificar padding melhorado
        const padding = await firstCard.getCssValue('padding');
        expect(parseInt(padding)).toBeGreaterThanOrEqual(16);
      }
    });

    afterEach(async () => {
      // Fechar modal
      const closeBtn = element(by.css('.close-btn, button[aria-label="Fechar"]'));
      if (await closeBtn.isPresent()) {
        await closeBtn.click();
        await browser.wait(EC.invisibilityOf(element(by.css('app-pokemon-details-mobile'))), 3000);
      }
    });
  });

  describe('🎨 Melhorias de Tipografia', () => {
    it('should have readable font sizes on mobile', async () => {
      // Verificar título da página
      const pageTitle = element(by.css('ion-title'));
      const titleFontSize = await pageTitle.getCssValue('font-size');
      expect(parseInt(titleFontSize)).toBeGreaterThanOrEqual(20); // >= 20px

      // Verificar informações de paginação
      const pageInfo = element(by.css('.page-info-mobile'));
      if (await pageInfo.isPresent()) {
        const infoFontSize = await pageInfo.getCssValue('font-size');
        expect(parseInt(infoFontSize)).toBeGreaterThanOrEqual(16); // >= 16px
      }
    });

    it('should have proper contrast and readability', async () => {
      // Verificar se os elementos têm cores adequadas para contraste
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      const cardCount = await pokemonCards.count();
      
      if (cardCount > 0) {
        const firstCard = pokemonCards.first();
        const cardText = element(firstCard.locator().by.css('h3, .pokemon-name'));
        
        if (await cardText.isPresent()) {
          const textColor = await cardText.getCssValue('color');
          const backgroundColor = await firstCard.getCssValue('background-color');
          
          // Verificar se não são cores muito similares (contraste básico)
          expect(textColor).not.toBe(backgroundColor);
        }
      }
    });
  });

  describe('📊 Validação de Responsividade', () => {
    it('should adapt to different mobile screen sizes', async () => {
      const screenSizes = [
        { width: 320, height: 568 }, // iPhone 5/SE
        { width: 375, height: 667 }, // iPhone 6/7/8
        { width: 414, height: 736 }  // iPhone 6/7/8 Plus
      ];

      for (const size of screenSizes) {
        await browser.manage().window().setSize(size.width, size.height);
        await browser.refresh();
        
        // Aguardar carregamento
        await browser.wait(EC.presenceOf(element(by.css('.pokemon-grid-mobile'))), 5000);
        
        // Verificar se o layout se adapta
        const pageContainer = element(by.css('.page-container-mobile'));
        const containerWidth = await pageContainer.getSize();
        
        expect(containerWidth.width).toBeLessThanOrEqual(size.width);
        
        // Verificar se não há scroll horizontal
        const bodyWidth = await browser.executeScript('return document.body.scrollWidth;');
        expect(bodyWidth).toBeLessThanOrEqual(size.width + 20); // Margem de 20px para tolerância
      }
    });
  });
});
