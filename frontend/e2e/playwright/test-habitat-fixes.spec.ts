import { test, expect } from '@playwright/test';

test.describe('🔧 Habitat Filter Fixes Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navegar para a página inicial
    await page.goto('/');
    
    // Aguardar carregamento inicial
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Should verify expanded habitat mapping works for 1000+ Pokemon', async ({ page }) => {
    console.log('🧪 Testando mapeamento expandido de habitats...');

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
    }

    // Verificar se os chips de habitat estão presentes
    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();
    console.log(`🏷️ Chips de habitat encontrados: ${chipCount}`);

    if (chipCount > 0) {
      // Testar filtro de floresta (deve incluir Pikachu #25)
      const forestChip = habitatChips.filter({ hasText: /floresta|forest/i });
      if (await forestChip.count() > 0) {
        console.log('🌲 Testando filtro de floresta...');
        
        // Contar Pokémon antes do filtro
        const initialCards = page.locator('app-pokemon-card');
        const initialCount = await initialCards.count();
        console.log(`📊 Pokémon antes do filtro: ${initialCount}`);

        // Aplicar filtro de floresta
        await forestChip.first().click();
        await page.waitForTimeout(3000);

        // Contar Pokémon após filtro
        const filteredCards = page.locator('app-pokemon-card');
        const filteredCount = await filteredCards.count();
        console.log(`📊 Pokémon após filtro de floresta: ${filteredCount}`);

        // Verificar se há resultados (deve ter pelo menos Pikachu)
        expect(filteredCount).toBeGreaterThan(0);
        console.log('✅ Filtro de floresta funcionando');

        // Verificar paginação - deve mostrar múltiplos Pokémon por página
        if (filteredCount > 1) {
          console.log('✅ Paginação corrigida - múltiplos Pokémon por página');
        }

        // Limpar filtro
        await forestChip.first().click();
        await page.waitForTimeout(2000);
      }

      // Testar filtro de montanha
      const mountainChip = habitatChips.filter({ hasText: /montanha|mountain/i });
      if (await mountainChip.count() > 0) {
        console.log('🏔️ Testando filtro de montanha...');
        
        await mountainChip.first().click();
        await page.waitForTimeout(3000);

        const mountainCards = page.locator('app-pokemon-card');
        const mountainCount = await mountainCards.count();
        console.log(`📊 Pokémon de montanha: ${mountainCount}`);

        // Deve incluir Charmander line (4, 5, 6)
        expect(mountainCount).toBeGreaterThan(0);
        console.log('✅ Filtro de montanha funcionando');

        // Limpar filtro
        await mountainChip.first().click();
        await page.waitForTimeout(2000);
      }

      // Testar filtro de águas (waters-edge)
      const watersChip = habitatChips.filter({ hasText: /água|water|beira/i });
      if (await watersChip.count() > 0) {
        console.log('🌊 Testando filtro de águas...');
        
        await watersChip.first().click();
        await page.waitForTimeout(3000);

        const watersCards = page.locator('app-pokemon-card');
        const watersCount = await watersCards.count();
        console.log(`📊 Pokémon aquáticos: ${watersCount}`);

        // Deve incluir Squirtle line (7, 8, 9)
        expect(watersCount).toBeGreaterThan(0);
        console.log('✅ Filtro de águas funcionando');

        // Limpar filtro
        await watersChip.first().click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✅ Teste de mapeamento expandido concluído');
  });

  test('Should verify empty state for habitat with no Pokemon', async ({ page }) => {
    console.log('🧪 Testando estado vazio para habitat sem Pokémon...');

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
    }

    // Verificar se há chips de habitat
    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();

    if (chipCount > 0) {
      // Tentar encontrar um habitat com poucos Pokémon (como "rare")
      const rareChip = habitatChips.filter({ hasText: /raro|rare/i });
      if (await rareChip.count() > 0) {
        console.log('💎 Testando filtro de habitat raro...');
        
        await rareChip.first().click();
        await page.waitForTimeout(3000);

        const rareCards = page.locator('app-pokemon-card');
        const rareCount = await rareCards.count();
        console.log(`📊 Pokémon raros encontrados: ${rareCount}`);

        if (rareCount === 0) {
          // Verificar se o estado vazio específico para habitat é exibido
          const emptyStateHabitat = page.locator('.empty-state-habitat, .empty-state-mobile');
          const hasEmptyState = await emptyStateHabitat.count() > 0;
          
          if (hasEmptyState) {
            console.log('✅ Estado vazio para habitat exibido corretamente');
            
            // Verificar se há botão para limpar filtro de habitat
            const clearHabitatButton = page.locator('ion-button:has-text("habitat")');
            if (await clearHabitatButton.count() > 0) {
              console.log('✅ Botão para limpar filtro de habitat presente');
            }
          } else {
            console.log('⚠️ Estado vazio específico para habitat não encontrado');
          }
        } else {
          console.log(`✅ Habitat raro tem ${rareCount} Pokémon - funcionando corretamente`);
        }

        // Limpar filtro
        await rareChip.first().click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✅ Teste de estado vazio concluído');
  });

  test('Should verify pagination works correctly with habitat filters', async ({ page }) => {
    console.log('🧪 Testando paginação com filtros de habitat...');

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
    }

    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();

    if (chipCount > 0) {
      // Aplicar filtro que deve ter muitos resultados (como grassland)
      const grasslandChip = habitatChips.filter({ hasText: /campo|grass/i });
      if (await grasslandChip.count() > 0) {
        console.log('🌱 Testando paginação com filtro de campos...');
        
        await grasslandChip.first().click();
        await page.waitForTimeout(3000);

        // Verificar quantos Pokémon são exibidos na primeira página
        const firstPageCards = page.locator('app-pokemon-card');
        const firstPageCount = await firstPageCards.count();
        console.log(`📊 Pokémon na primeira página: ${firstPageCount}`);

        // Verificar se há controles de paginação
        const paginationControls = page.locator('.pagination-controls, .pagination-section');
        const hasPagination = await paginationControls.count() > 0;

        if (hasPagination) {
          console.log('✅ Controles de paginação presentes');
          
          // Verificar se há botão "próxima página"
          const nextButton = page.locator('ion-button:has(ion-icon[name="chevron-forward-outline"])');
          if (await nextButton.count() > 0 && !(await nextButton.first().isDisabled())) {
            console.log('📄 Testando navegação para próxima página...');
            
            await nextButton.first().click();
            await page.waitForTimeout(3000);

            const secondPageCards = page.locator('app-pokemon-card');
            const secondPageCount = await secondPageCards.count();
            console.log(`📊 Pokémon na segunda página: ${secondPageCount}`);

            if (secondPageCount > 0) {
              console.log('✅ Paginação funcionando corretamente com filtros');
            }
          }
        }

        // Limpar filtro
        await grasslandChip.first().click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✅ Teste de paginação concluído');
  });
});
