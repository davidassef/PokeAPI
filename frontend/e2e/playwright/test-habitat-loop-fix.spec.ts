import { test, expect } from '@playwright/test';

test.describe('🔄 Habitat Filter Loop Fix Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Should not enter infinite loading loop when habitat filter is applied', async ({ page }) => {
    console.log('🧪 Testando se o loop infinito foi corrigido...');

    let loadingCount = 0;
    let lastLoadingTime = 0;
    let habitatFilterApplied = false;
    let pokemonFound = 0;

    // Monitorar console para detectar loops
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Carregando Pokémons') || text.includes('loading')) {
        loadingCount++;
        lastLoadingTime = Date.now();
        console.log(`🔄 Loading detectado #${loadingCount}: ${text}`);
      }
      if (text.includes('Aplicando filtro de habitat otimizado')) {
        habitatFilterApplied = true;
        console.log('✅ Filtro de habitat otimizado aplicado:', text);
      }
      if (text.includes('Filtro de habitat aplicado')) {
        const match = text.match(/(\d+) Pokémon encontrados/);
        if (match) {
          pokemonFound = parseInt(match[1]);
          console.log(`📊 Pokémon encontrados: ${pokemonFound}`);
        }
      }
    });

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }

    // Verificar se há chips de habitat
    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();
    console.log(`🏷️ Chips de habitat encontrados: ${chipCount}`);

    if (chipCount > 0) {
      // Aplicar filtro de floresta (deve ter resultados)
      const forestChip = habitatChips.filter({ hasText: /floresta|forest/i });
      if (await forestChip.count() > 0) {
        console.log('🌲 Aplicando filtro de floresta...');
        
        const startTime = Date.now();
        await forestChip.first().click();
        
        // Aguardar até 10 segundos para o carregamento completar
        let completed = false;
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos (500ms * 20)
        
        while (!completed && attempts < maxAttempts) {
          await page.waitForTimeout(500);
          attempts++;
          
          // Verificar se o loading parou
          const loadingSpinner = page.locator('app-loading-spinner');
          const isLoading = await loadingSpinner.count() > 0;
          
          if (!isLoading) {
            // Verificar se há Pokémon ou estado vazio
            const pokemonCards = page.locator('app-pokemon-card');
            const emptyState = page.locator('.empty-state-habitat, .empty-state-mobile');
            
            const cardCount = await pokemonCards.count();
            const hasEmptyState = await emptyState.count() > 0;
            
            if (cardCount > 0 || hasEmptyState) {
              completed = true;
              console.log(`✅ Carregamento completado em ${Date.now() - startTime}ms`);
              console.log(`📊 Pokémon exibidos: ${cardCount}`);
              console.log(`📭 Estado vazio: ${hasEmptyState}`);
            }
          }
        }
        
        // Verificar se não entrou em loop
        if (loadingCount > 5) {
          console.log(`⚠️ Possível loop detectado: ${loadingCount} tentativas de loading`);
        } else {
          console.log(`✅ Sem loop detectado: ${loadingCount} tentativas de loading`);
        }
        
        // Verificar se o filtro foi aplicado corretamente
        if (habitatFilterApplied) {
          console.log('✅ Filtro de habitat foi aplicado com otimização');
        } else {
          console.log('⚠️ Filtro de habitat não foi detectado');
        }
        
        // Verificar resultado final
        if (completed) {
          console.log('✅ Carregamento completou sem loop infinito');
          expect(loadingCount).toBeLessThan(5); // Não deve ter mais que 5 tentativas
        } else {
          console.log('❌ Carregamento não completou - possível loop');
          expect(completed).toBeTruthy();
        }
        
        // Limpar filtro
        await forestChip.first().click();
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ Chip de floresta não encontrado');
      }
    } else {
      console.log('⚠️ Nenhum chip de habitat encontrado');
    }

    console.log('✅ Teste de loop infinito concluído');
  });

  test('Should handle habitat filter with no results gracefully', async ({ page }) => {
    console.log('🧪 Testando filtro de habitat sem resultados...');

    let loadingCount = 0;
    let emptyStateShown = false;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('loading') || text.includes('Carregando')) {
        loadingCount++;
      }
    });

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }

    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();

    if (chipCount > 0) {
      // Tentar filtro que pode ter poucos resultados
      const rareChip = habitatChips.filter({ hasText: /raro|rare/i });
      if (await rareChip.count() > 0) {
        console.log('💎 Aplicando filtro de habitat raro...');
        
        await rareChip.first().click();
        await page.waitForTimeout(5000);
        
        // Verificar se estado vazio é exibido
        const emptyState = page.locator('.empty-state-habitat, .empty-state-mobile');
        emptyStateShown = await emptyState.count() > 0;
        
        const pokemonCards = page.locator('app-pokemon-card');
        const cardCount = await pokemonCards.count();
        
        console.log(`📊 Pokémon encontrados: ${cardCount}`);
        console.log(`📭 Estado vazio exibido: ${emptyStateShown}`);
        console.log(`🔄 Tentativas de loading: ${loadingCount}`);
        
        // Verificar se não entrou em loop
        expect(loadingCount).toBeLessThan(5);
        
        if (cardCount === 0) {
          // Se não há Pokémon, deve mostrar estado vazio
          expect(emptyStateShown).toBeTruthy();
          console.log('✅ Estado vazio exibido corretamente');
        } else {
          console.log(`✅ ${cardCount} Pokémon raros encontrados`);
        }
        
        // Limpar filtro
        await rareChip.first().click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✅ Teste de estado vazio concluído');
  });

  test('Should handle multiple habitat filter changes without issues', async ({ page }) => {
    console.log('🧪 Testando múltiplas mudanças de filtro...');

    let totalLoadingCount = 0;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('loading') || text.includes('Carregando')) {
        totalLoadingCount++;
      }
    });

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }

    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();

    if (chipCount >= 3) {
      console.log('🔄 Testando múltiplas mudanças de filtro...');
      
      // Aplicar e remover 3 filtros diferentes
      for (let i = 0; i < Math.min(3, chipCount); i++) {
        const chip = habitatChips.nth(i);
        const chipText = await chip.textContent();
        
        console.log(`🎯 Aplicando filtro: ${chipText?.trim()}`);
        await chip.click();
        await page.waitForTimeout(2000);
        
        console.log(`🎯 Removendo filtro: ${chipText?.trim()}`);
        await chip.click();
        await page.waitForTimeout(1000);
      }
      
      console.log(`🔄 Total de tentativas de loading: ${totalLoadingCount}`);
      
      // Não deve ter muitas tentativas de loading
      expect(totalLoadingCount).toBeLessThan(15); // 3 filtros * 5 max tentativas
      console.log('✅ Múltiplas mudanças de filtro funcionando corretamente');
    }

    console.log('✅ Teste de múltiplas mudanças concluído');
  });
});
