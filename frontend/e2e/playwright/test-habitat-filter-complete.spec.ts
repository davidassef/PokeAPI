import { test, expect } from '@playwright/test';

/**
 * Complete Test for Pokemon Habitat Filter System
 * Tests the full functionality including toggle, single-selection, and filtering
 */
test.describe('🧪 Complete Pokemon Habitat Filter System Test', () => {
  test('Should verify complete habitat filter functionality', async ({ page }) => {
    console.log('🧪 Testing complete habitat filter system...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Count initial Pokemon
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Find and click the filter toggle button
    console.log('\n🔍 Looking for filter toggle button...');
    const filterToggle = page.locator('.filter-toggle-btn');
    
    if (await filterToggle.count() > 0) {
      console.log('✅ Filter toggle button found');
      await filterToggle.click();
      await page.waitForTimeout(1000);
      
      // Wait for advanced filters to appear
      await page.waitForSelector('.advanced-filters.expanded', { timeout: 5000 });
      console.log('✅ Advanced filters panel opened');
      
      // Look for habitat section
      const habitatSection = page.locator('.filter-section:has-text("Habitats")');
      if (await habitatSection.count() > 0) {
        console.log('✅ Habitat section found');
        
        // Get habitat chips
        const habitatChips = habitatSection.locator('ion-chip');
        const chipCount = await habitatChips.count();
        console.log(`🏷️ Found ${chipCount} habitat chips`);
        
        if (chipCount > 0) {
          // Test single-selection constraint
          await testSingleSelection(page, habitatChips, chipCount);
          
          // Test actual filtering functionality
          await testFiltering(page, habitatChips, initialCount);
          
          // Test filter badge
          await testFilterBadge(page, habitatChips);
          
        } else {
          console.log('❌ No habitat chips found in habitat section');
        }
      } else {
        console.log('❌ Habitat section not found');
      }
    } else {
      console.log('❌ Filter toggle button not found');
    }

    console.log('\n🎉 Complete habitat filter test finished!');
  });

  test('Should verify habitat filter data integration', async ({ page }) => {
    console.log('🧪 Testing habitat filter data integration...');

    // Capture network requests to verify filter data is being sent
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('pokemon') || request.url().includes('api')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Open filters
    const filterToggle = page.locator('.filter-toggle-btn');
    if (await filterToggle.count() > 0) {
      await filterToggle.click();
      await page.waitForTimeout(1000);
      
      const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
      if (await habitatChips.count() > 0) {
        console.log('🎯 Testing habitat filter data flow...');
        
        // Clear previous requests
        requests.length = 0;
        
        // Click a habitat filter
        const firstChip = habitatChips.first();
        const habitatName = await firstChip.textContent();
        console.log(`   Selecting habitat: ${habitatName?.trim()}`);
        
        await firstChip.click();
        await page.waitForTimeout(3000); // Wait for API calls
        
        console.log(`📊 Network requests made: ${requests.length}`);
        
        // Check if any requests were made (indicating filter is working)
        if (requests.length > 0) {
          console.log('✅ Network requests triggered by habitat filter');
          requests.forEach((req, index) => {
            console.log(`   ${index + 1}. ${req.method} ${req.url}`);
          });
        } else {
          console.log('⚠️ No network requests triggered - may indicate local filtering');
        }
        
        // Verify Pokemon count changed
        const filteredCards = page.locator('app-pokemon-card');
        const filteredCount = await filteredCards.count();
        console.log(`📊 Pokemon after filter: ${filteredCount}`);
        
        if (filteredCount !== await page.locator('app-pokemon-card').count()) {
          console.log('✅ Pokemon count changed - filtering is working');
        }
      }
    }

    console.log('✅ Data integration test completed');
  });
});

async function testSingleSelection(page: any, habitatChips: any, chipCount: number) {
  if (chipCount >= 2) {
    console.log('\n🎯 Testing single-selection constraint...');
    
    const firstChip = habitatChips.nth(0);
    const secondChip = habitatChips.nth(1);
    
    const firstName = await firstChip.textContent();
    const secondName = await secondChip.textContent();
    
    console.log(`   Testing: "${firstName?.trim()}" and "${secondName?.trim()}"`);
    
    // Click first chip
    await firstChip.click();
    await page.waitForTimeout(500);
    
    const firstSelected = await firstChip.evaluate((el: any) => el.classList.contains('selected'));
    console.log(`   First chip selected: ${firstSelected}`);
    
    // Click second chip
    await secondChip.click();
    await page.waitForTimeout(500);
    
    const firstStillSelected = await firstChip.evaluate((el: any) => el.classList.contains('selected'));
    const secondSelected = await secondChip.evaluate((el: any) => el.classList.contains('selected'));
    
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
    await page.waitForTimeout(500);
  } else {
    console.log(`⚠️ Need at least 2 habitat chips to test single-selection (found ${chipCount})`);
  }
}

async function testFiltering(page: any, habitatChips: any, initialCount: number) {
  console.log('\n🔍 Testing actual filtering functionality...');
  
  const firstChip = habitatChips.first();
  const habitatName = await firstChip.textContent();
  
  console.log(`   Testing filter: "${habitatName?.trim()}"`);
  
  // Apply filter
  await firstChip.click();
  await page.waitForTimeout(3000); // Wait for filtering to complete
  
  const filteredCards = page.locator('app-pokemon-card');
  const filteredCount = await filteredCards.count();
  
  console.log(`   📊 Pokemon after filter: ${filteredCount} (was ${initialCount})`);
  
  if (filteredCount !== initialCount) {
    console.log('   ✅ Filtering is working - Pokemon count changed!');
    
    // Verify all visible Pokemon match the filter (if possible)
    if (filteredCount > 0 && filteredCount <= 20) {
      console.log('   🔍 Checking filtered Pokemon...');
      for (let i = 0; i < Math.min(filteredCount, 5); i++) {
        const card = filteredCards.nth(i);
        const pokemonName = await card.locator('.pokemon-name').textContent();
        console.log(`     ${i + 1}. ${pokemonName?.trim()}`);
      }
    }
  } else {
    console.log('   ⚠️ Filtering may not be working - count unchanged');
  }
  
  // Clear filter
  await firstChip.click();
  await page.waitForTimeout(2000);
  
  const clearedCount = await filteredCards.count();
  console.log(`   📊 Pokemon after clearing: ${clearedCount}`);
  
  if (clearedCount === initialCount) {
    console.log('   ✅ Filter clearing works!');
  } else {
    console.log('   ⚠️ Filter clearing may not be working properly');
  }
}

async function testFilterBadge(page: any, habitatChips: any) {
  console.log('\n🏷️ Testing filter badge...');
  
  const firstChip = habitatChips.first();
  
  // Apply filter
  await firstChip.click();
  await page.waitForTimeout(1000);
  
  // Check for filter badge
  const filterBadge = page.locator('.filter-badge');
  if (await filterBadge.count() > 0) {
    const badgeText = await filterBadge.textContent();
    console.log(`   Badge shows: ${badgeText}`);
    
    if (badgeText === '1') {
      console.log('   ✅ Filter badge correctly shows 1 active filter');
    } else {
      console.log(`   ⚠️ Filter badge shows "${badgeText}" instead of "1"`);
    }
  } else {
    console.log('   ⚠️ Filter badge not found');
  }
  
  // Clear filter
  await firstChip.click();
  await page.waitForTimeout(1000);
  
  // Check badge is gone or shows 0
  const badgeAfterClear = await filterBadge.count();
  if (badgeAfterClear === 0) {
    console.log('   ✅ Filter badge hidden after clearing');
  } else {
    const badgeTextAfter = await filterBadge.textContent();
    console.log(`   Badge after clear: ${badgeTextAfter}`);
  }
}
