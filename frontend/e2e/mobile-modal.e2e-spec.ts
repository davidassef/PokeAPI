import { browser, by, element, ExpectedConditions as EC } from 'protractor';

describe('Mobile Modal E2E Tests', () => {
  const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone X dimensions
  const DESKTOP_VIEWPORT = { width: 1200, height: 800 };

  beforeEach(async () => {
    await browser.get('/');
  });

  describe('Device Detection and Routing', () => {
    it('should redirect to mobile interface when viewport is mobile', async () => {
      await browser.manage().window().setSize(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
      await browser.refresh();

      // Wait for redirection
      await browser.wait(EC.urlContains('/mobile/home'), 5000);

      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).toContain('/mobile/home');
    });

    it('should redirect to web interface when viewport is desktop', async () => {
      await browser.manage().window().setSize(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
      await browser.refresh();

      // Wait for redirection
      await browser.wait(EC.urlContains('/tabs/home'), 5000);

      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).toContain('/tabs/home');
    });
  });

  describe('Mobile Modal Functionality', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await browser.manage().window().setSize(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
      await browser.get('/mobile/home');

      // Wait for page to load
      await browser.wait(EC.presenceOf(element(by.css('.pokemon-grid'))), 10000);
    });

    it('should open mobile modal when clicking on pokemon card', async () => {
      // Wait for pokemon cards to load
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await browser.wait(EC.presenceOf(pokemonCards.first()), 10000);

      // Click on first pokemon card
      await pokemonCards.first().click();

      // Wait for mobile modal to appear
      const mobileModal = element(by.css('app-pokemon-details-mobile'));
      await browser.wait(EC.presenceOf(mobileModal), 5000);

      // Verify modal is visible
      expect(await mobileModal.isDisplayed()).toBe(true);

      // Verify modal has mobile-specific styling
      const modalContainer = element(by.css('.mobile-modal-container'));
      expect(await modalContainer.isDisplayed()).toBe(true);
    });

    it('should display correct tabs in mobile modal', async () => {
      // Open modal
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await pokemonCards.first().click();

      // Wait for modal
      await browser.wait(EC.presenceOf(element(by.css('app-pokemon-details-mobile'))), 5000);

      // Check for mobile tabs
      const tabs = element.all(by.css('.mobile-tabs .tab-btn'));
      expect(await tabs.count()).toBe(4);

      // Verify tab names
      const tabTexts = await tabs.map(tab => tab.getText());
      expect(tabTexts).toContain('Visão Geral');
      expect(tabTexts).toContain('Combate');
      expect(tabTexts).toContain('Evolução');
      expect(tabTexts).toContain('Curiosidades');
    });

    it('should switch between tabs correctly', async () => {
      // Open modal
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await pokemonCards.first().click();

      // Wait for modal
      await browser.wait(EC.presenceOf(element(by.css('app-pokemon-details-mobile'))), 5000);

      // Click on Combat tab
      const combatTab = element(by.css('.tab-btn[ng-reflect-ng-class*="combat"]'));
      await combatTab.click();

      // Verify combat content is visible
      const combatContent = element(by.css('.tab-panel[ng-reflect-ng-if="combat"]'));
      await browser.wait(EC.visibilityOf(combatContent), 3000);
      expect(await combatContent.isDisplayed()).toBe(true);

      // Click on Evolution tab
      const evolutionTab = element(by.css('.tab-btn[ng-reflect-ng-class*="evolution"]'));
      await evolutionTab.click();

      // Verify evolution content is visible
      const evolutionContent = element(by.css('.tab-panel[ng-reflect-ng-if="evolution"]'));
      await browser.wait(EC.visibilityOf(evolutionContent), 3000);
      expect(await evolutionContent.isDisplayed()).toBe(true);
    });

    it('should close modal when clicking close button', async () => {
      // Open modal
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await pokemonCards.first().click();

      // Wait for modal
      const mobileModal = element(by.css('app-pokemon-details-mobile'));
      await browser.wait(EC.presenceOf(mobileModal), 5000);

      // Click close button
      const closeButton = element(by.css('.close-btn'));
      await closeButton.click();

      // Verify modal is closed
      await browser.wait(EC.invisibilityOf(mobileModal), 3000);
      expect(await mobileModal.isPresent()).toBe(false);
    });

    it('should close modal when clicking backdrop', async () => {
      // Open modal
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await pokemonCards.first().click();

      // Wait for modal
      const mobileModal = element(by.css('app-pokemon-details-mobile'));
      await browser.wait(EC.presenceOf(mobileModal), 5000);

      // Click on backdrop (overlay)
      const backdrop = element(by.css('.mobile-modal-overlay'));
      await backdrop.click();

      // Verify modal is closed
      await browser.wait(EC.invisibilityOf(mobileModal), 3000);
      expect(await mobileModal.isPresent()).toBe(false);
    });

    it('should display pokemon information correctly', async () => {
      // Open modal for first pokemon (should be Bulbasaur)
      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await pokemonCards.first().click();

      // Wait for modal
      await browser.wait(EC.presenceOf(element(by.css('app-pokemon-details-mobile'))), 5000);

      // Verify pokemon name is displayed
      const pokemonName = element(by.css('.pokemon-name'));
      expect(await pokemonName.getText()).toContain('bulbasaur');

      // Verify stats are displayed
      const statCards = element.all(by.css('.stat-card'));
      expect(await statCards.count()).toBeGreaterThan(0);

      // Verify pokemon image is displayed
      const pokemonImage = element(by.css('.pokemon-image img'));
      expect(await pokemonImage.isDisplayed()).toBe(true);
    });
  });

  describe('Mobile vs Web Modal Comparison', () => {
    it('should use different modal components for mobile and web', async () => {
      // Test mobile modal
      await browser.manage().window().setSize(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
      await browser.get('/mobile/home');

      const pokemonCards = element.all(by.css('app-pokemon-card'));
      await browser.wait(EC.presenceOf(pokemonCards.first()), 10000);
      await pokemonCards.first().click();

      // Verify mobile modal is used
      const mobileModal = element(by.css('app-pokemon-details-mobile'));
      await browser.wait(EC.presenceOf(mobileModal), 5000);
      expect(await mobileModal.isPresent()).toBe(true);

      // Verify web modal is NOT used
      const webModal = element(by.css('app-details-modal'));
      expect(await webModal.isPresent()).toBe(false);

      // Close modal
      const closeButton = element(by.css('.close-btn'));
      await closeButton.click();
      await browser.wait(EC.invisibilityOf(mobileModal), 3000);

      // Test web modal
      await browser.manage().window().setSize(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
      await browser.get('/tabs/home');

      const webPokemonCards = element.all(by.css('app-pokemon-card'));
      await browser.wait(EC.presenceOf(webPokemonCards.first()), 10000);
      await webPokemonCards.first().click();

      // Verify web modal is used
      const webModalAfterResize = element(by.css('app-details-modal'));
      await browser.wait(EC.presenceOf(webModalAfterResize), 5000);
      expect(await webModalAfterResize.isPresent()).toBe(true);

      // Verify mobile modal is NOT used
      const mobileModalAfterResize = element(by.css('app-pokemon-details-mobile'));
      expect(await mobileModalAfterResize.isPresent()).toBe(false);
    });
  });
});
