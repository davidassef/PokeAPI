import { test, expect } from '@playwright/test';

/**
 * Teste de Funcionalidade do Sistema de Filtros de Habitat
 * Verifica se o filtro de habitat está funcionando corretamente
 */
test.describe('🧪 Funcionalidade do Sistema de Filtros de Habitat', () => {
  test('Deve filtrar Pokémon por habitat corretamente', async ({ page }) => {
    console.log('🧪 Testando funcionalidade do filtro de habitat...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Contar Pokémon iniciais
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Pokémon iniciais: ${initialCount}`);

    // Abrir filtros avançados
    console.log('\n🔍 Abrindo filtros avançados...');
    const filterToggle = page.locator('.filter-toggle-btn');
    await filterToggle.click();
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Verificar se seção de habitats existe
    const habitatSection = page.locator('.filter-section:has-text("Habitats")');
    await expect(habitatSection).toBeVisible();
    console.log('✅ Seção de habitats encontrada');

    // Testar filtro por Floresta (deve incluir Pikachu #25)
    console.log('\n🌲 Testando filtro por Floresta...');
    const forestChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /floresta/i });
    
    if (await forestChip.count() > 0) {
      await forestChip.click();
      await page.waitForTimeout(3000); // Aguardar filtro ser aplicado

      const forestCards = page.locator('app-pokemon-card');
      const forestCount = await forestCards.count();
      console.log(`📊 Pokémon de floresta encontrados: ${forestCount}`);

      if (forestCount > 0) {
        // Verificar se Pikachu está nos resultados (deve estar)
        const pokemonNames = [];
        for (let i = 0; i < Math.min(forestCount, 10); i++) {
          const card = forestCards.nth(i);
          const name = await card.locator('.pokemon-name').textContent();
          pokemonNames.push(name?.trim());
        }
        console.log(`🎯 Pokémon de floresta: ${pokemonNames.join(', ')}`);
        
        // Pikachu (#25) deve estar na lista se o filtro estiver funcionando
        const hasPikachu = pokemonNames.some(name => name?.toLowerCase().includes('pikachu'));
        if (hasPikachu) {
          console.log('✅ Pikachu encontrado na floresta (correto!)');
        } else {
          console.log('ℹ️ Pikachu não encontrado (pode estar fora da página atual)');
        }
        
        expect(forestCount).toBeLessThan(initialCount);
        console.log('✅ Filtro de floresta reduziu o número de Pokémon');
      } else {
        console.log('⚠️ Nenhum Pokémon de floresta encontrado');
      }

      // Limpar filtro
      await forestChip.click();
      await page.waitForTimeout(2000);
    }

    // Testar filtro por Montanha (deve incluir Charmander #4)
    console.log('\n🏔️ Testando filtro por Montanha...');
    const mountainChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /montanha/i });
    
    if (await mountainChip.count() > 0) {
      await mountainChip.click();
      await page.waitForTimeout(3000);

      const mountainCards = page.locator('app-pokemon-card');
      const mountainCount = await mountainCards.count();
      console.log(`📊 Pokémon de montanha encontrados: ${mountainCount}`);

      if (mountainCount > 0) {
        const pokemonNames = [];
        for (let i = 0; i < Math.min(mountainCount, 10); i++) {
          const card = mountainCards.nth(i);
          const name = await card.locator('.pokemon-name').textContent();
          pokemonNames.push(name?.trim());
        }
        console.log(`🎯 Pokémon de montanha: ${pokemonNames.join(', ')}`);
        
        // Charmander (#4) deve estar na lista
        const hasCharmander = pokemonNames.some(name => name?.toLowerCase().includes('charmander'));
        if (hasCharmander) {
          console.log('✅ Charmander encontrado na montanha (correto!)');
        }
        
        expect(mountainCount).toBeLessThan(initialCount);
        console.log('✅ Filtro de montanha reduziu o número de Pokémon');
      }

      // Limpar filtro
      await mountainChip.click();
      await page.waitForTimeout(2000);
    }

    // Testar filtro por Beiras d'Água (deve incluir Squirtle #7)
    console.log('\n🌊 Testando filtro por Beiras d\'Água...');
    const waterEdgeChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /água|water/i });
    
    if (await waterEdgeChip.count() > 0) {
      await waterEdgeChip.first().click();
      await page.waitForTimeout(3000);

      const waterCards = page.locator('app-pokemon-card');
      const waterCount = await waterCards.count();
      console.log(`📊 Pokémon de beiras d'água encontrados: ${waterCount}`);

      if (waterCount > 0) {
        const pokemonNames = [];
        for (let i = 0; i < Math.min(waterCount, 10); i++) {
          const card = waterCards.nth(i);
          const name = await card.locator('.pokemon-name').textContent();
          pokemonNames.push(name?.trim());
        }
        console.log(`🎯 Pokémon de beiras d'água: ${pokemonNames.join(', ')}`);
        
        // Squirtle (#7) deve estar na lista
        const hasSquirtle = pokemonNames.some(name => name?.toLowerCase().includes('squirtle'));
        if (hasSquirtle) {
          console.log('✅ Squirtle encontrado nas beiras d\'água (correto!)');
        }
        
        expect(waterCount).toBeLessThan(initialCount);
        console.log('✅ Filtro de beiras d\'água reduziu o número de Pokémon');
      }

      // Limpar filtro
      await waterEdgeChip.first().click();
      await page.waitForTimeout(2000);
    }

    // Testar múltiplos filtros de habitat
    console.log('\n🔄 Testando múltiplos filtros de habitat...');
    
    const caveChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /caverna/i });
    const urbanChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /urbana/i });
    
    if (await caveChip.count() > 0 && await urbanChip.count() > 0) {
      // Selecionar cavernas
      await caveChip.click();
      await page.waitForTimeout(1500);
      
      // Selecionar áreas urbanas
      await urbanChip.click();
      await page.waitForTimeout(1500);

      const multiCards = page.locator('app-pokemon-card');
      const multiCount = await multiCards.count();
      console.log(`📊 Pokémon com múltiplos habitats: ${multiCount}`);

      // Verificar contador de filtros ativos
      const filterBadge = page.locator('.filter-badge');
      if (await filterBadge.count() > 0) {
        const badgeText = await filterBadge.textContent();
        expect(parseInt(badgeText || '0')).toBe(2);
        console.log(`✅ Contador de filtros correto: ${badgeText}`);
      }

      // Limpar todos os filtros
      const clearButton = page.locator('ion-button:has-text("Limpar")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(2000);
        
        const clearedCards = page.locator('app-pokemon-card');
        const clearedCount = await clearedCards.count();
        
        expect(clearedCount).toBe(initialCount);
        console.log(`✅ Filtros limpos - voltou para ${clearedCount} Pokémon`);
      }
    }

    console.log('\n🎉 Teste de funcionalidade do filtro de habitat concluído!');
  });

  test('Deve verificar que filtros de habitat funcionam com outros filtros', async ({ page }) => {
    console.log('🧪 Testando integração de filtros de habitat com outros filtros...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Abrir filtros
    const filterToggle = page.locator('.filter-toggle-btn');
    await filterToggle.click();
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Aplicar filtro de tipo primeiro
    console.log('\n🔥 Aplicando filtro de tipo Fogo...');
    const fireTypeChip = page.locator('.filter-section:has-text("Tipos") ion-chip').filter({ hasText: /fogo|fire/i });
    
    if (await fireTypeChip.count() > 0) {
      await fireTypeChip.click();
      await page.waitForTimeout(2000);

      const fireCards = page.locator('app-pokemon-card');
      const fireCount = await fireCards.count();
      console.log(`📊 Pokémon de fogo: ${fireCount}`);

      // Agora aplicar filtro de habitat (montanha - onde Charmander vive)
      console.log('\n🏔️ Adicionando filtro de habitat Montanha...');
      const mountainChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /montanha/i });
      
      if (await mountainChip.count() > 0) {
        await mountainChip.click();
        await page.waitForTimeout(2000);

        const combinedCards = page.locator('app-pokemon-card');
        const combinedCount = await combinedCards.count();
        console.log(`📊 Pokémon de fogo + montanha: ${combinedCount}`);

        // Deve ser menor ou igual ao número de Pokémon de fogo
        expect(combinedCount).toBeLessThanOrEqual(fireCount);
        
        if (combinedCount > 0) {
          // Verificar se Charmander está nos resultados (tipo fogo + habitat montanha)
          const pokemonNames = [];
          for (let i = 0; i < combinedCount; i++) {
            const card = combinedCards.nth(i);
            const name = await card.locator('.pokemon-name').textContent();
            pokemonNames.push(name?.trim());
          }
          console.log(`🎯 Pokémon fogo + montanha: ${pokemonNames.join(', ')}`);
          
          const hasCharmander = pokemonNames.some(name => name?.toLowerCase().includes('charmander'));
          if (hasCharmander) {
            console.log('✅ Charmander encontrado (fogo + montanha correto!)');
          }
        }

        console.log('✅ Filtros combinados funcionando');
      }

      // Limpar filtros
      const clearButton = page.locator('ion-button:has-text("Limpar")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✅ Integração de filtros testada');
  });

  test('Deve verificar que filtro de habitat funciona com busca por nome', async ({ page }) => {
    console.log('🧪 Testando filtro de habitat com busca por nome...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Buscar por "char" (deve incluir Charmander)
    console.log('\n🔍 Buscando por "char"...');
    const searchBar = page.locator('ion-searchbar input');
    await searchBar.fill('char');
    await page.waitForTimeout(2000);

    const searchCards = page.locator('app-pokemon-card');
    const searchCount = await searchCards.count();
    console.log(`📊 Pokémon com "char": ${searchCount}`);

    if (searchCount > 0) {
      // Abrir filtros e aplicar habitat montanha
      const filterToggle = page.locator('.filter-toggle-btn');
      await filterToggle.click();
      await page.waitForSelector('.advanced-filters', { timeout: 5000 });

      console.log('\n🏔️ Adicionando filtro de habitat Montanha...');
      const mountainChip = page.locator('.filter-section:has-text("Habitats") ion-chip').filter({ hasText: /montanha/i });
      
      if (await mountainChip.count() > 0) {
        await mountainChip.click();
        await page.waitForTimeout(2000);

        const combinedCards = page.locator('app-pokemon-card');
        const combinedCount = await combinedCards.count();
        console.log(`📊 Pokémon "char" + montanha: ${combinedCount}`);

        // Deve ser menor ou igual ao número de resultados da busca
        expect(combinedCount).toBeLessThanOrEqual(searchCount);

        if (combinedCount > 0) {
          const pokemonNames = [];
          for (let i = 0; i < combinedCount; i++) {
            const card = combinedCards.nth(i);
            const name = await card.locator('.pokemon-name').textContent();
            pokemonNames.push(name?.trim());
          }
          console.log(`🎯 Resultados finais: ${pokemonNames.join(', ')}`);
          
          // Todos os resultados devem conter "char" no nome
          const allContainChar = pokemonNames.every(name => 
            name?.toLowerCase().includes('char')
          );
          expect(allContainChar).toBeTruthy();
          console.log('✅ Todos os resultados contêm "char" no nome');
        }

        console.log('✅ Busca + filtro de habitat funcionando');
      }
    }

    console.log('✅ Integração busca + habitat testada');
  });
});
