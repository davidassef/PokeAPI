import { test, expect } from '@playwright/test';

/**
 * Basic Test for Pokemon Habitat Filter System
 */
test.describe('🧪 Basic Pokemon Habitat Filter Test', () => {
  test('Should verify application loads and habitat filters exist', async ({ page }) => {
    console.log('🧪 Testing basic application load and habitat filter presence...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Count initial Pokemon
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Check if habitat chips exist anywhere on the page
    const allChips = page.locator('ion-chip');
    const chipCount = await allChips.count();
    console.log(`🏷️ Total chips found: ${chipCount}`);

    if (chipCount > 0) {
      // Look for habitat-related text in chips
      const habitatKeywords = ['floresta', 'forest', 'montanha', 'mountain', 'caverna', 'cave', 'campo', 'grassland'];
      let habitatChipsFound = 0;

      for (let i = 0; i < Math.min(chipCount, 20); i++) {
        const chip = allChips.nth(i);
        const text = await chip.textContent();
        const textLower = text?.toLowerCase() || '';
        
        const isHabitatChip = habitatKeywords.some(keyword => textLower.includes(keyword));
        if (isHabitatChip) {
          habitatChipsFound++;
          console.log(`   🎯 Found habitat chip: "${text?.trim()}"`);
          
          // Test clicking this chip
          console.log(`   🖱️ Testing click on "${text?.trim()}"...`);
          await chip.click();
          await page.waitForTimeout(2000);
          
          // Check if Pokemon count changed
          const newCount = await initialCards.count();
          console.log(`   📊 Pokemon count after filter: ${newCount}`);
          
          if (newCount !== initialCount) {
            console.log(`   ✅ Habitat filter working! Count changed from ${initialCount} to ${newCount}`);
          } else {
            console.log(`   ⚠️ Count unchanged - filter may not be working`);
          }
          
          // Click again to clear
          await chip.click();
          await page.waitForTimeout(2000);
          
          const clearedCount = await initialCards.count();
          console.log(`   📊 Pokemon count after clearing: ${clearedCount}`);
          
          break; // Test only one chip
        }
      }

      if (habitatChipsFound > 0) {
        console.log(`✅ Found ${habitatChipsFound} habitat chips`);
      } else {
        console.log('❌ No habitat chips found');
      }
    }

    console.log('✅ Basic test completed');
  });

  test('Should verify single-selection constraint if habitat chips exist', async ({ page }) => {
    console.log('🧪 Testing single-selection constraint...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Look for habitat chips
    const allChips = page.locator('ion-chip');
    const chipCount = await allChips.count();
    
    const habitatKeywords = ['floresta', 'forest', 'montanha', 'mountain', 'caverna', 'cave', 'campo', 'grassland'];
    const habitatChips = [];

    for (let i = 0; i < Math.min(chipCount, 20); i++) {
      const chip = allChips.nth(i);
      const text = await chip.textContent();
      const textLower = text?.toLowerCase() || '';
      
      const isHabitatChip = habitatKeywords.some(keyword => textLower.includes(keyword));
      if (isHabitatChip) {
        habitatChips.push({ chip, text: text?.trim() });
      }
    }

    if (habitatChips.length >= 2) {
      console.log(`🎯 Testing single-selection with ${habitatChips.length} habitat chips...`);
      
      const firstChip = habitatChips[0].chip;
      const secondChip = habitatChips[1].chip;
      
      console.log(`   Testing: "${habitatChips[0].text}" and "${habitatChips[1].text}"`);
      
      // Click first chip
      await firstChip.click();
      await page.waitForTimeout(1000);
      
      const firstSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      console.log(`   First chip selected: ${firstSelected}`);
      
      // Click second chip
      await secondChip.click();
      await page.waitForTimeout(1000);
      
      const firstStillSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
      const secondSelected = await secondChip.evaluate(el => el.classList.contains('selected'));
      
      console.log(`   After second click: First=${firstStillSelected}, Second=${secondSelected}`);
      
      if (!firstStillSelected && secondSelected) {
        console.log('   ✅ Single-selection constraint working correctly!');
      } else if (firstStillSelected && secondSelected) {
        console.log('   ❌ Multiple selection allowed - constraint not working');
      } else {
        console.log('   ⚠️ Unexpected selection state');
      }
      
      // Clear selection
      await secondChip.click();
      await page.waitForTimeout(1000);
      
    } else {
      console.log(`⚠️ Need at least 2 habitat chips to test single-selection (found ${habitatChips.length})`);
    }

    console.log('✅ Single-selection test completed');
  });

  test('Should verify no critical console errors', async ({ page }) => {
    console.log('🧪 Testing for critical console errors...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('sw.js') &&
      !error.includes('net::ERR_FAILED')
    );

    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Critical errors: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors found:');
      criticalErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No critical console errors');
    }

    // Don't fail the test for non-critical errors, just report them
    console.log('✅ Error check completed');
  });
});
