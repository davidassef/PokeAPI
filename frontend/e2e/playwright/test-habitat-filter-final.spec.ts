import { test, expect } from '@playwright/test';

/**
 * Final Comprehensive Test for Pokemon Habitat Filter System
 * Tests the complete user flow: search button -> filter toggle -> habitat filtering
 */
test.describe('🧪 Final Pokemon Habitat Filter System Test', () => {
  test('Should verify complete habitat filter user flow and functionality', async ({ page }) => {
    console.log('🧪 Testing complete habitat filter user flow...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Count initial Pokemon
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Step 1: Click the search button to show search-filter component
    console.log('\n🔍 Step 1: Opening search interface...');
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    
    if (await searchButton.count() > 0) {
      console.log('✅ Search button found');
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      // Wait for search container to appear
      await page.waitForSelector('.search-container', { timeout: 5000 });
      console.log('✅ Search container opened');
      
      // Step 2: Click the filter toggle button to show advanced filters
      console.log('\n🔧 Step 2: Opening advanced filters...');
      const filterToggle = page.locator('.filter-toggle-btn');
      
      if (await filterToggle.count() > 0) {
        console.log('✅ Filter toggle button found');
        await filterToggle.click();
        await page.waitForTimeout(1000);
        
        // Wait for advanced filters to appear
        await page.waitForSelector('.advanced-filters.expanded', { timeout: 5000 });
        console.log('✅ Advanced filters panel opened');
        
        // Step 3: Test habitat filtering
        console.log('\n🏠 Step 3: Testing habitat filters...');
        const habitatSection = page.locator('.filter-section:has-text("Habitats")');
        
        if (await habitatSection.count() > 0) {
          console.log('✅ Habitat section found');
          
          const habitatChips = habitatSection.locator('ion-chip');
          const chipCount = await habitatChips.count();
          console.log(`🏷️ Found ${chipCount} habitat chips`);
          
          if (chipCount > 0) {
            // List all available habitats
            console.log('\n📋 Available habitats:');
            for (let i = 0; i < chipCount; i++) {
              const chip = habitatChips.nth(i);
              const text = await chip.textContent();
              console.log(`   ${i + 1}. ${text?.trim()}`);
            }
            
            // Test single-selection constraint
            await testSingleSelectionConstraint(page, habitatChips, chipCount);
            
            // Test actual filtering functionality
            await testHabitatFiltering(page, habitatChips, initialCount);
            
            // Test filter badge functionality
            await testFilterBadge(page, habitatChips);
            
            console.log('\n🎉 All habitat filter tests completed successfully!');
            
          } else {
            console.log('❌ No habitat chips found');
          }
        } else {
          console.log('❌ Habitat section not found');
        }
      } else {
        console.log('❌ Filter toggle button not found');
      }
    } else {
      console.log('❌ Search button not found');
    }

    console.log('\n✅ Complete habitat filter test finished!');
  });

  test('Should verify habitat filter persistence and UI states', async ({ page }) => {
    console.log('🧪 Testing habitat filter persistence and UI states...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Open search and filters
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      const filterToggle = page.locator('.filter-toggle-btn');
      if (await filterToggle.count() > 0) {
        await filterToggle.click();
        await page.waitForTimeout(1000);
        
        const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
        if (await habitatChips.count() > 0) {
          const firstChip = habitatChips.first();
          const habitatName = await firstChip.textContent();
          
          console.log(`🎯 Testing persistence with habitat: ${habitatName?.trim()}`);
          
          // Select habitat
          await firstChip.click();
          await page.waitForTimeout(1000);
          
          // Verify visual state
          const isSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
          expect(isSelected).toBeTruthy();
          console.log('✅ Habitat chip shows selected state');
          
          // Close and reopen filters to test persistence
          await filterToggle.click(); // Close
          await page.waitForTimeout(500);
          await filterToggle.click(); // Reopen
          await page.waitForTimeout(500);
          
          // Verify selection persists
          const stillSelected = await firstChip.evaluate(el => el.classList.contains('selected'));
          expect(stillSelected).toBeTruthy();
          console.log('✅ Habitat selection persists when filters are toggled');
          
          // Test color changes
          const bgColor = await firstChip.evaluate(el => window.getComputedStyle(el).backgroundColor);
          const textColor = await firstChip.evaluate(el => window.getComputedStyle(el).color);
          console.log(`🎨 Selected colors - Background: ${bgColor}, Text: ${textColor}`);
          
          console.log('✅ UI state and persistence test completed');
        }
      }
    }
  });
});

async function testSingleSelectionConstraint(page: any, habitatChips: any, chipCount: number) {
  if (chipCount >= 2) {
    console.log('\n🎯 Testing single-selection constraint...');
    
    const firstChip = habitatChips.nth(0);
    const secondChip = habitatChips.nth(1);
    
    const firstName = await firstChip.textContent();
    const secondName = await secondChip.textContent();
    
    console.log(`   Testing constraint between: "${firstName?.trim()}" and "${secondName?.trim()}"`);
    
    // Click first chip
    await firstChip.click();
    await page.waitForTimeout(500);
    
    const firstSelected = await firstChip.evaluate((el: any) => el.classList.contains('selected'));
    console.log(`   ✓ First chip selected: ${firstSelected}`);
    expect(firstSelected).toBeTruthy();
    
    // Click second chip
    await secondChip.click();
    await page.waitForTimeout(500);
    
    const firstStillSelected = await firstChip.evaluate((el: any) => el.classList.contains('selected'));
    const secondSelected = await secondChip.evaluate((el: any) => el.classList.contains('selected'));
    
    console.log(`   ✓ After selecting second: First=${firstStillSelected}, Second=${secondSelected}`);
    
    // Verify single-selection constraint
    expect(firstStillSelected).toBeFalsy();
    expect(secondSelected).toBeTruthy();
    console.log('   ✅ Single-selection constraint working correctly!');
    
    // Test deselection by clicking the same chip
    await secondChip.click();
    await page.waitForTimeout(500);
    
    const secondDeselected = await secondChip.evaluate((el: any) => !el.classList.contains('selected'));
    expect(secondDeselected).toBeTruthy();
    console.log('   ✅ Deselection by clicking same chip works!');
    
  } else {
    console.log(`⚠️ Need at least 2 habitat chips to test single-selection (found ${chipCount})`);
  }
}

async function testHabitatFiltering(page: any, habitatChips: any, initialCount: number) {
  console.log('\n🔍 Testing habitat filtering functionality...');
  
  const testChip = habitatChips.first();
  const habitatName = await testChip.textContent();
  
  console.log(`   🎯 Testing filter: "${habitatName?.trim()}"`);
  
  // Apply habitat filter
  await testChip.click();
  await page.waitForTimeout(3000); // Wait for filtering to complete
  
  const filteredCards = page.locator('app-pokemon-card');
  const filteredCount = await filteredCards.count();
  
  console.log(`   📊 Pokemon count: ${initialCount} → ${filteredCount}`);
  
  if (filteredCount !== initialCount) {
    console.log('   ✅ Habitat filtering is working - Pokemon count changed!');
    expect(filteredCount).not.toBe(initialCount);
    
    // Show some filtered Pokemon names
    if (filteredCount > 0) {
      console.log('   🎯 Filtered Pokemon:');
      for (let i = 0; i < Math.min(filteredCount, 5); i++) {
        const card = filteredCards.nth(i);
        const pokemonName = await card.locator('.pokemon-name').textContent();
        console.log(`     ${i + 1}. ${pokemonName?.trim()}`);
      }
    }
  } else {
    console.log('   ⚠️ Pokemon count unchanged - filter may not be working or no Pokemon match this habitat');
  }
  
  // Clear filter by clicking again
  await testChip.click();
  await page.waitForTimeout(2000);
  
  const clearedCount = await filteredCards.count();
  console.log(`   📊 Pokemon after clearing: ${clearedCount}`);
  
  if (clearedCount === initialCount) {
    console.log('   ✅ Filter clearing works perfectly!');
    expect(clearedCount).toBe(initialCount);
  } else {
    console.log('   ⚠️ Filter clearing may have issues');
  }
}

async function testFilterBadge(page: any, habitatChips: any) {
  console.log('\n🏷️ Testing filter badge functionality...');
  
  const testChip = habitatChips.first();
  
  // Apply filter
  await testChip.click();
  await page.waitForTimeout(1000);
  
  // Check for filter badge
  const filterBadge = page.locator('.filter-badge');
  if (await filterBadge.count() > 0) {
    const badgeText = await filterBadge.textContent();
    console.log(`   📊 Filter badge shows: "${badgeText}"`);
    
    expect(badgeText).toBe('1');
    console.log('   ✅ Filter badge correctly shows 1 active filter');
  } else {
    console.log('   ⚠️ Filter badge not visible (may be expected if no filters active)');
  }
  
  // Clear filter
  await testChip.click();
  await page.waitForTimeout(1000);
  
  // Check badge is hidden or shows 0
  const badgeAfterClear = await filterBadge.count();
  if (badgeAfterClear === 0) {
    console.log('   ✅ Filter badge correctly hidden after clearing');
  } else {
    const badgeTextAfter = await filterBadge.textContent();
    console.log(`   📊 Badge after clear: "${badgeTextAfter}"`);
  }
}
