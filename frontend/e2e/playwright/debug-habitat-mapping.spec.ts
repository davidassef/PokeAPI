import { test, expect } from '@playwright/test';

/**
 * Debug Test para verificar o mapeamento de habitats
 */
test.describe('🔍 Debug Habitat Mapping', () => {
  test('Should debug habitat filter mapping and results', async ({ page }) => {
    console.log('🔍 Debugando mapeamento de habitats...');

    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('habitat') || text.includes('Aplicando filtro') || text.includes('encontrados')) {
        console.log(`🖥️ Console: ${text}`);
      }
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Contar Pokémon iniciais
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Pokémon iniciais: ${initialCount}`);

    // Listar os primeiros Pokémon para ver quais IDs temos
    console.log('\n📋 Primeiros Pokémon carregados:');
    for (let i = 0; i < Math.min(initialCount, 12); i++) {
      const card = initialCards.nth(i);
      const name = await card.locator('.pokemon-name').textContent();
      const idElement = card.locator('.pokemon-id');
      let pokemonId = 'N/A';
      
      if (await idElement.count() > 0) {
        const idText = await idElement.textContent();
        pokemonId = idText?.replace('#', '') || 'N/A';
      }
      
      console.log(`   ${i + 1}. ${name?.trim()} (ID: ${pokemonId})`);
    }

    // Abrir busca e filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      const filterToggle = page.locator('.filter-toggle-btn');
      if (await filterToggle.count() > 0) {
        await filterToggle.click();
        await page.waitForTimeout(1000);
        
        // Testar cada habitat individualmente
        const habitatSection = page.locator('.filter-section:has-text("Habitats")');
        if (await habitatSection.count() > 0) {
          const habitatChips = habitatSection.locator('ion-chip');
          const chipCount = await habitatChips.count();
          
          console.log(`\n🏷️ Habitats disponíveis: ${chipCount}`);
          
          for (let i = 0; i < chipCount; i++) {
            const chip = habitatChips.nth(i);
            const habitatName = await chip.textContent();
            
            console.log(`\n🎯 Testando habitat: "${habitatName?.trim()}"`);
            
            // Limpar logs anteriores
            consoleLogs.length = 0;
            
            // Aplicar filtro
            await chip.click();
            await page.waitForTimeout(3000);
            
            // Verificar resultados
            const filteredCards = page.locator('app-pokemon-card');
            const filteredCount = await filteredCards.count();
            
            console.log(`   📊 Resultado: ${filteredCount} Pokémon encontrados`);
            
            if (filteredCount > 0) {
              console.log('   ✅ Habitat com Pokémon encontrados:');
              for (let j = 0; j < Math.min(filteredCount, 5); j++) {
                const card = filteredCards.nth(j);
                const name = await card.locator('.pokemon-name').textContent();
                const idElement = card.locator('.pokemon-id');
                let pokemonId = 'N/A';
                
                if (await idElement.count() > 0) {
                  const idText = await idElement.textContent();
                  pokemonId = idText?.replace('#', '') || 'N/A';
                }
                
                console.log(`     ${j + 1}. ${name?.trim()} (ID: ${pokemonId})`);
              }
            } else {
              console.log('   ❌ Nenhum Pokémon encontrado para este habitat');
            }
            
            // Verificar logs do console
            const habitatLogs = consoleLogs.filter(log => 
              log.includes('habitat') || log.includes('Aplicando filtro') || log.includes('encontrados')
            );
            
            if (habitatLogs.length > 0) {
              console.log('   🖥️ Logs relevantes:');
              habitatLogs.forEach(log => console.log(`     ${log}`));
            }
            
            // Limpar filtro
            await chip.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }

    console.log('\n🎉 Debug de habitats concluído!');
  });

  test('Should verify habitat mapping coverage', async ({ page }) => {
    console.log('🔍 Verificando cobertura do mapeamento de habitats...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Injetar código para verificar o mapeamento
    const mappingInfo = await page.evaluate(() => {
      // Simular o mapeamento que está no código
      const habitatMapping: { [key: number]: string } = {
        // Grassland (campos)
        1: 'grassland', 2: 'grassland', 3: 'grassland', // Bulbasaur line
        10: 'grassland', 11: 'grassland', 12: 'grassland', // Caterpie line
        13: 'grassland', 14: 'grassland', 15: 'grassland', // Weedle line
        16: 'grassland', 17: 'grassland', 18: 'grassland', // Pidgey line
        19: 'grassland', 20: 'grassland', // Rattata line
        21: 'grassland', 22: 'grassland', // Spearow line
        25: 'forest', 26: 'forest', // Pikachu line

        // Mountain (montanhas)
        4: 'mountain', 5: 'mountain', 6: 'mountain', // Charmander line
        27: 'mountain', 28: 'mountain', // Sandshrew line
        35: 'mountain', 36: 'mountain', // Clefairy line
        74: 'mountain', 75: 'mountain', 76: 'mountain', // Geodude line

        // Waters-edge (beiras d'água)
        7: 'waters-edge', 8: 'waters-edge', 9: 'waters-edge', // Squirtle line
        54: 'waters-edge', 55: 'waters-edge', // Psyduck line
        60: 'waters-edge', 61: 'waters-edge', 62: 'waters-edge', // Poliwag line
        72: 'waters-edge', 73: 'waters-edge', // Tentacool line
        79: 'waters-edge', 80: 'waters-edge', // Slowpoke line
        90: 'waters-edge', 91: 'waters-edge', // Shellder line
        98: 'waters-edge', 99: 'waters-edge', // Krabby line
        116: 'waters-edge', 117: 'waters-edge', // Horsea line
        118: 'waters-edge', 119: 'waters-edge', // Goldeen line
        120: 'waters-edge', 121: 'waters-edge', // Staryu line
        129: 'waters-edge', 130: 'waters-edge', // Magikarp line
        131: 'waters-edge', // Lapras
        134: 'waters-edge', // Vaporeon

        // Sea (oceanos)
        138: 'sea', 139: 'sea', // Omanyte line
        140: 'sea', 141: 'sea', // Kabuto line

        // Forest (florestas)
        23: 'forest', 24: 'forest', // Ekans line
        29: 'forest', 30: 'forest', 31: 'forest', // Nidoran♀ line
        32: 'forest', 33: 'forest', 34: 'forest', // Nidoran♂ line
        39: 'forest', 40: 'forest', // Jigglypuff line
        43: 'forest', 44: 'forest', 45: 'forest', // Oddish line
        46: 'forest', 47: 'forest', // Paras line
        48: 'forest', 49: 'forest', // Venonat line
        69: 'forest', 70: 'forest', 71: 'forest', // Bellsprout line
        102: 'forest', 103: 'forest', // Exeggcute line
        114: 'forest', // Tangela

        // Cave (cavernas)
        41: 'cave', 42: 'cave', // Zubat line
        50: 'cave', 51: 'cave', // Diglett line
        66: 'cave', 67: 'cave', 68: 'cave', // Machop line
        95: 'cave', // Onix
        104: 'cave', 105: 'cave', // Cubone line

        // Urban (áreas urbanas)
        52: 'urban', 53: 'urban', // Meowth line
        56: 'urban', 57: 'urban', // Mankey line
        58: 'urban', 59: 'urban', // Growlithe line
        63: 'urban', 64: 'urban', 65: 'urban', // Abra line
        77: 'urban', 78: 'urban', // Ponyta line
        81: 'urban', 82: 'urban', // Magnemite line
        83: 'urban', // Farfetch'd
        84: 'urban', 85: 'urban', // Doduo line
        88: 'urban', 89: 'urban', // Grimer line
        96: 'urban', 97: 'urban', // Drowzee line
        100: 'urban', 101: 'urban', // Voltorb line
        106: 'urban', // Hitmonlee
        107: 'urban', // Hitmonchan
        108: 'urban', // Lickitung
        109: 'urban', 110: 'urban', // Koffing line
        111: 'urban', 112: 'urban', // Rhyhorn line
        113: 'urban', // Chansey
        115: 'urban', // Kangaskhan
        122: 'urban', // Mr. Mime
        123: 'urban', // Scyther
        124: 'urban', // Jynx
        125: 'urban', // Electabuzz
        126: 'urban', // Magmar
        127: 'urban', // Pinsir
        128: 'urban', // Tauros
        132: 'urban', // Ditto
        133: 'urban', // Eevee
        135: 'urban', // Jolteon
        136: 'urban', // Flareon
        137: 'urban', // Porygon

        // Rare (locais raros)
        142: 'rare', // Aerodactyl
        143: 'rare', // Snorlax
        144: 'rare', // Articuno
        145: 'rare', // Zapdos
        146: 'rare', // Moltres
        147: 'rare', 148: 'rare', 149: 'rare', // Dratini line
        150: 'rare', // Mewtwo
        151: 'rare', // Mew
      };

      // Analisar cobertura
      const habitatCounts: { [key: string]: number } = {};
      const mappedIds = Object.keys(habitatMapping).map(id => parseInt(id));
      
      Object.values(habitatMapping).forEach(habitat => {
        habitatCounts[habitat] = (habitatCounts[habitat] || 0) + 1;
      });

      return {
        totalMapped: mappedIds.length,
        minId: Math.min(...mappedIds),
        maxId: Math.max(...mappedIds),
        habitatCounts,
        mappedIds: mappedIds.sort((a, b) => a - b)
      };
    });

    console.log('\n📊 Análise do mapeamento de habitats:');
    console.log(`   Total de Pokémon mapeados: ${mappingInfo.totalMapped}`);
    console.log(`   Range de IDs: ${mappingInfo.minId} - ${mappingInfo.maxId}`);
    console.log('\n📈 Distribuição por habitat:');
    
    Object.entries(mappingInfo.habitatCounts).forEach(([habitat, count]) => {
      console.log(`   ${habitat}: ${count} Pokémon`);
    });

    console.log('\n🔢 IDs mapeados:');
    console.log(`   ${mappingInfo.mappedIds.join(', ')}`);

    // Verificar se os primeiros 12 Pokémon estão mapeados
    console.log('\n🎯 Verificação dos primeiros 12 Pokémon:');
    for (let i = 1; i <= 12; i++) {
      const isMapped = mappingInfo.mappedIds.includes(i);
      const habitat = isMapped ? Object.entries(mappingInfo).find(([id]) => parseInt(id) === i)?.[1] : 'não mapeado';
      console.log(`   Pokémon #${i}: ${isMapped ? '✅' : '❌'} ${habitat || ''}`);
    }

    console.log('\n✅ Análise de cobertura concluída!');
  });
});
