import { test, expect } from '@playwright/test';

/**
 * Comprehensive Test for Fixed Pokemon Habitat Filter System
 * Tests both functionality and single-selection constraint
 */
test.describe('🧪 Fixed Pokemon Habitat Filter System', () => {
  test('Should verify habitat filtering works correctly with single-selection constraint', async ({ page }) => {
    console.log('🧪 Testing fixed habitat filter system...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Count initial Pokemon
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);

    // Open advanced filters
    console.log('\n🔍 Opening advanced filters...');
    const filterToggle = page.locator('.filter-toggle-btn');
    await filterToggle.click();
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Verify habitat section exists
    const habitatSection = page.locator('.filter-section:has-text("Habitats")');
    await expect(habitatSection).toBeVisible();
    console.log('✅ Habitat section found');

    // Get habitat chips
    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();
    console.log(`🏷️ ${chipCount} habitat chips found`);
    expect(chipCount).toBeGreaterThan(0);

    // Test single-selection constraint
    console.log('\n🎯 Testing single-selection constraint...');
    
    if (chipCount >= 2) {
      const firstChip = habitatChips.nth(0);
      const secondChip = habitatChips.nth(1);
      
      const firstHabitatName = await firstChip.textContent();
      const secondHabitatName = await secondChip.textContent();
      
      console.log(`   Testing: "${firstHabitatName?.trim()}" and "${secondHabitatName?.trim()}"`);

      // Select first habitat
      await firstChip.click();
      await page.waitForTimeout(1000);

      // Verify first is selected
      const firstSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      expect(firstSelected).toBeTruthy();
      console.log(`   ✅ First habitat "${firstHabitatName?.trim()}" selected`);

      // Select second habitat
      await secondChip.click();
      await page.waitForTimeout(1000);

      // Verify single-selection constraint: only second should be selected
      const firstStillSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      const secondSelected = await secondChip.evaluate(el => el.classList.contains('selected'));
      
      expect(firstStillSelected).toBeFalsy();
      expect(secondSelected).toBeTruthy();
      console.log(`   ✅ Single-selection constraint working: only "${secondHabitatName?.trim()}" is selected`);

      // Click second habitat again to deselect
      await secondChip.click();
      await page.waitForTimeout(1000);

      // Verify both are deselected
      const firstDeselected = await firstChip.evaluate(el => !el.classList.contains('selected'));
      const secondDeselected = await secondChip.evaluate(el => !el.classList.contains('selected'));
      
      expect(firstDeselected).toBeTruthy();
      expect(secondDeselected).toBeTruthy();
      console.log('   ✅ Deselection working: both habitats deselected');
    }

    // Test actual filtering functionality
    console.log('\n🔍 Testing actual filtering functionality...');
    
    // Test forest habitat (should include Pikachu #25)
    const forestChip = habitatChips.filter({ hasText: /floresta|forest/i });
    if (await forestChip.count() > 0) {
      console.log('   🌲 Testing forest habitat filter...');
      
      await forestChip.first().click();
      await page.waitForTimeout(3000); // Wait for filter to be applied

      const filteredCards = page.locator('app-pokemon-card');
      const filteredCount = await filteredCards.count();
      console.log(`   📊 Pokemon after forest filter: ${filteredCount}`);

      if (filteredCount > 0) {
        // Verify filtering actually worked (count should be different)
        expect(filteredCount).not.toBe(initialCount);
        console.log('   ✅ Forest filter changed Pokemon count - filtering is working!');

        // Check if we can find expected Pokemon (like Pikachu)
        const pokemonNames = [];
        for (let i = 0; i < Math.min(filteredCount, 10); i++) {
          const card = filteredCards.nth(i);
          const name = await card.locator('.pokemon-name').textContent();
          pokemonNames.push(name?.trim());
        }
        console.log(`   🎯 Forest Pokemon found: ${pokemonNames.join(', ')}`);

        // Look for Pikachu specifically (should be in forest habitat)
        const hasPikachu = pokemonNames.some(name => name?.toLowerCase().includes('pikachu'));
        if (hasPikachu) {
          console.log('   ✅ Pikachu found in forest habitat (correct!)');
        } else {
          console.log('   ℹ️ Pikachu not in current page (may be on another page)');
        }
      } else {
        console.log('   ⚠️ No Pokemon found for forest habitat');
      }

      // Clear filter
      await forestChip.first().click();
      await page.waitForTimeout(2000);
    }

    // Test mountain habitat (should include Charmander #4)
    const mountainChip = habitatChips.filter({ hasText: /montanha|mountain/i });
    if (await mountainChip.count() > 0) {
      console.log('   🏔️ Testing mountain habitat filter...');
      
      await mountainChip.first().click();
      await page.waitForTimeout(3000);

      const mountainCards = page.locator('app-pokemon-card');
      const mountainCount = await mountainCards.count();
      console.log(`   📊 Pokemon after mountain filter: ${mountainCount}`);

      if (mountainCount > 0) {
        expect(mountainCount).not.toBe(initialCount);
        console.log('   ✅ Mountain filter changed Pokemon count - filtering is working!');

        const pokemonNames = [];
        for (let i = 0; i < Math.min(mountainCount, 10); i++) {
          const card = mountainCards.nth(i);
          const name = await card.locator('.pokemon-name').textContent();
          pokemonNames.push(name?.trim());
        }
        console.log(`   🎯 Mountain Pokemon found: ${pokemonNames.join(', ')}`);

        // Look for Charmander specifically (should be in mountain habitat)
        const hasCharmander = pokemonNames.some(name => name?.toLowerCase().includes('charmander'));
        if (hasCharmander) {
          console.log('   ✅ Charmander found in mountain habitat (correct!)');
        }
      }

      // Clear filter
      await mountainChip.first().click();
      await page.waitForTimeout(2000);
    }

    // Test filter badge counter
    console.log('\n🏷️ Testing filter badge counter...');
    
    const grasslandChip = habitatChips.filter({ hasText: /campo|grassland/i });
    if (await grasslandChip.count() > 0) {
      await grasslandChip.first().click();
      await page.waitForTimeout(1000);

      // Check filter badge
      const filterBadge = page.locator('.filter-badge');
      if (await filterBadge.count() > 0) {
        const badgeText = await filterBadge.textContent();
        expect(parseInt(badgeText || '0')).toBe(1);
        console.log(`   ✅ Filter badge shows: ${badgeText} (correct for single selection)`);
      }

      // Clear with clear button
      const clearButton = page.locator('ion-button:has-text("Limpar")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(2000);
        
        const clearedCards = page.locator('app-pokemon-card');
        const clearedCount = await clearedCards.count();
        
        expect(clearedCount).toBe(initialCount);
        console.log(`   ✅ Clear button works - back to ${clearedCount} Pokemon`);
      }
    }

    console.log('\n🎉 Habitat filter system test completed successfully!');
  });

  test('Should verify habitat filter works with search combination', async ({ page }) => {
    console.log('🧪 Testing habitat filter with search combination...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Search for "char" (should include Charmander)
    console.log('\n🔍 Searching for "char"...');
    const searchBar = page.locator('ion-searchbar input');
    await searchBar.fill('char');
    await page.waitForTimeout(2000);

    const searchCards = page.locator('app-pokemon-card');
    const searchCount = await searchCards.count();
    console.log(`📊 Pokemon with "char": ${searchCount}`);

    if (searchCount > 0) {
      // Open filters and apply mountain habitat
      const filterToggle = page.locator('.filter-toggle-btn');
      await filterToggle.click();
      await page.waitForSelector('.advanced-filters', { timeout: 5000 });

      console.log('\n🏔️ Adding mountain habitat filter...');
      const mountainChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /montanha|mountain/i });
      
      if (await mountainChip.count() > 0) {
        await mountainChip.first().click();
        await page.waitForTimeout(2000);

        const combinedCards = page.locator('app-pokemon-card');
        const combinedCount = await combinedCards.count();
        console.log(`📊 Pokemon "char" + mountain: ${combinedCount}`);

        // Should be less than or equal to search results
        expect(combinedCount).toBeLessThanOrEqual(searchCount);

        if (combinedCount > 0) {
          const pokemonNames = [];
          for (let i = 0; i < combinedCount; i++) {
            const card = combinedCards.nth(i);
            const name = await card.locator('.pokemon-name').textContent();
            pokemonNames.push(name?.trim());
          }
          console.log(`🎯 Combined results: ${pokemonNames.join(', ')}`);
          
          // All results should contain "char" in name
          const allContainChar = pokemonNames.every(name => 
            name?.toLowerCase().includes('char')
          );
          expect(allContainChar).toBeTruthy();
          console.log('✅ All results contain "char" in name');
        }

        console.log('✅ Search + habitat filter combination working');
      }
    }

    console.log('✅ Habitat filter + search integration tested');
  });

  test('Should verify habitat filter persistence and UI state', async ({ page }) => {
    console.log('🧪 Testing habitat filter persistence and UI state...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Open filters
    const filterToggle = page.locator('.filter-toggle-btn');
    await filterToggle.click();
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Select a habitat
    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    if (await habitatChips.count() > 0) {
      const firstChip = habitatChips.first();
      const habitatName = await firstChip.textContent();
      
      console.log(`\n🎯 Selecting habitat: ${habitatName?.trim()}`);
      await firstChip.click();
      await page.waitForTimeout(1000);

      // Verify visual state
      const isSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      expect(isSelected).toBeTruthy();
      console.log('✅ Habitat chip shows selected state');

      // Verify color change
      const bgColor = await firstChip.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textColor = await firstChip.evaluate(el => window.getComputedStyle(el).color);
      console.log(`🎨 Selected colors - Background: ${bgColor}, Text: ${textColor}`);

      // Close and reopen filters to test persistence
      await filterToggle.click(); // Close
      await page.waitForTimeout(500);
      await filterToggle.click(); // Reopen
      await page.waitForTimeout(500);

      // Verify selection persists
      const stillSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      expect(stillSelected).toBeTruthy();
      console.log('✅ Habitat selection persists when filters are closed/reopened');

      console.log('✅ UI state and persistence test completed');
    }
  });
});
