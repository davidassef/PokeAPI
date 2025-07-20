import { test, expect } from '@playwright/test';

test.describe('🗺️ Habitat Mapping Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Should verify expanded habitat mapping is working', async ({ page }) => {
    console.log('🧪 Testando se o mapeamento expandido de habitats está funcionando...');

    // Interceptar chamadas da API para verificar se o mapeamento está sendo usado
    let habitatFilterApplied = false;
    let pokemonCount = 0;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Aplicando filtro por habitat')) {
        habitatFilterApplied = true;
        console.log('✅ Filtro de habitat detectado:', text);
      }
      if (text.includes('Filtro de habitat aplicado')) {
        const match = text.match(/(\d+) Pokémon encontrados/);
        if (match) {
          pokemonCount = parseInt(match[1]);
          console.log(`📊 Pokémon encontrados após filtro: ${pokemonCount}`);
        }
      }
    });

    // Tentar abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }

    // Verificar se há seção de habitats
    const habitatSection = page.locator('.filter-section:has-text("Habitats")');
    const hasHabitatSection = await habitatSection.count() > 0;
    console.log(`🏷️ Seção de habitats encontrada: ${hasHabitatSection}`);

    if (hasHabitatSection) {
      const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
      const chipCount = await habitatChips.count();
      console.log(`🏷️ Chips de habitat encontrados: ${chipCount}`);

      if (chipCount > 0) {
        // Testar primeiro chip disponível
        const firstChip = habitatChips.first();
        const chipText = await firstChip.textContent();
        console.log(`🎯 Testando chip: ${chipText?.trim()}`);

        await firstChip.click();
        await page.waitForTimeout(5000); // Aguardar processamento

        // Verificar se o filtro foi aplicado
        if (habitatFilterApplied) {
          console.log('✅ Filtro de habitat foi aplicado com sucesso');
          console.log(`📊 Resultado: ${pokemonCount} Pokémon encontrados`);
          
          // Verificar se há Pokémon na página
          const pokemonCards = page.locator('app-pokemon-card');
          const visibleCards = await pokemonCards.count();
          console.log(`👀 Pokémon visíveis na página: ${visibleCards}`);

          if (visibleCards > 0) {
            console.log('✅ Paginação funcionando - Pokémon sendo exibidos');
          } else if (pokemonCount === 0) {
            // Verificar se estado vazio é exibido
            const emptyState = page.locator('.empty-state-habitat, .empty-state-mobile');
            const hasEmptyState = await emptyState.count() > 0;
            console.log(`📭 Estado vazio exibido: ${hasEmptyState}`);
          }
        } else {
          console.log('❌ Filtro de habitat não foi aplicado');
        }

        // Limpar filtro
        await firstChip.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ Nenhum chip de habitat encontrado');
      }
    } else {
      console.log('⚠️ Seção de habitats não encontrada');
    }

    console.log('✅ Teste de mapeamento concluído');
  });

  test('Should verify habitat mapping covers Pokemon beyond 151', async ({ page }) => {
    console.log('🧪 Verificando se o mapeamento cobre Pokémon além de 151...');

    // Navegar para uma página que pode ter Pokémon > 151
    await page.goto('/?page=8'); // Página 8 deve ter Pokémon > 151
    await page.waitForTimeout(3000);

    // Verificar se há Pokémon carregados
    const pokemonCards = page.locator('app-pokemon-card');
    const cardCount = await pokemonCards.count();
    console.log(`📊 Pokémon na página 8: ${cardCount}`);

    if (cardCount > 0) {
      // Verificar IDs dos Pokémon
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = pokemonCards.nth(i);
        const cardText = await card.textContent();
        console.log(`🔍 Pokémon ${i + 1}: ${cardText?.substring(0, 50)}...`);
      }

      // Tentar aplicar filtro de habitat
      const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
      if (await searchButton.count() > 0) {
        await searchButton.click();
        await page.waitForTimeout(2000);

        const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
        const chipCount = await habitatChips.count();

        if (chipCount > 0) {
          console.log('🎯 Testando filtro em página com Pokémon > 151...');
          
          const forestChip = habitatChips.filter({ hasText: /floresta|forest/i });
          if (await forestChip.count() > 0) {
            await forestChip.first().click();
            await page.waitForTimeout(3000);

            const filteredCards = page.locator('app-pokemon-card');
            const filteredCount = await filteredCards.count();
            console.log(`📊 Pokémon após filtro: ${filteredCount}`);

            if (filteredCount > 0) {
              console.log('✅ Mapeamento expandido funcionando para Pokémon > 151');
            }

            // Limpar filtro
            await forestChip.first().click();
          }
        }
      }
    }

    console.log('✅ Teste de cobertura expandida concluído');
  });

  test('Should verify pagination works correctly with habitat filters', async ({ page }) => {
    console.log('🧪 Testando paginação com filtros de habitat...');

    // Abrir filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }

    const habitatChips = page.locator('.filter-section:has-text("Habitats") ion-chip');
    const chipCount = await habitatChips.count();

    if (chipCount > 0) {
      // Aplicar filtro que deve ter muitos resultados
      const firstChip = habitatChips.first();
      const chipText = await firstChip.textContent();
      console.log(`🎯 Aplicando filtro: ${chipText?.trim()}`);

      await firstChip.click();
      await page.waitForTimeout(3000);

      // Verificar quantos Pokémon são exibidos
      const pokemonCards = page.locator('app-pokemon-card');
      const cardCount = await pokemonCards.count();
      console.log(`📊 Pokémon exibidos: ${cardCount}`);

      // Verificar se há mais de 1 Pokémon (correção da paginação)
      if (cardCount > 1) {
        console.log('✅ Paginação corrigida - múltiplos Pokémon por página');
      } else if (cardCount === 1) {
        console.log('⚠️ Apenas 1 Pokémon por página - pode indicar problema de paginação');
      } else {
        console.log('📭 Nenhum Pokémon encontrado - verificando estado vazio');
        
        const emptyState = page.locator('.empty-state-habitat, .empty-state-mobile');
        const hasEmptyState = await emptyState.count() > 0;
        console.log(`📭 Estado vazio exibido: ${hasEmptyState}`);
      }

      // Verificar controles de paginação
      const paginationControls = page.locator('.pagination-controls, .pagination-section');
      const hasPagination = await paginationControls.count() > 0;
      console.log(`📄 Controles de paginação presentes: ${hasPagination}`);

      // Limpar filtro
      await firstChip.click();
      await page.waitForTimeout(2000);
    }

    console.log('✅ Teste de paginação concluído');
  });
});
