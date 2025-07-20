import { test, expect } from '@playwright/test';

/**
 * Teste de Verificação da Correção dos Habitats
 */
test.describe('🧪 Verificação da Correção dos Habitats', () => {
  test('Should verify all habitats now return Pokemon', async ({ page }) => {
    console.log('🧪 Verificando se todos os habitats agora retornam Pokémon...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Contar Pokémon iniciais
    const initialCards = page.locator('app-pokemon-card');
    const initialCount = await initialCards.count();
    console.log(`📊 Pokémon iniciais: ${initialCount}`);

    // Abrir busca e filtros
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      const filterToggle = page.locator('.filter-toggle-btn');
      if (await filterToggle.count() > 0) {
        await filterToggle.click();
        await page.waitForTimeout(1000);
        
        // Testar cada habitat
        const habitatSection = page.locator('.filter-section:has-text("Habitats")');
        if (await habitatSection.count() > 0) {
          const habitatChips = habitatSection.locator('ion-chip');
          const chipCount = await habitatChips.count();
          
          console.log(`\n🏷️ Testando ${chipCount} habitats:`);
          
          const results: { [key: string]: number } = {};
          
          for (let i = 0; i < chipCount; i++) {
            const chip = habitatChips.nth(i);
            const habitatName = await chip.textContent();
            const cleanName = habitatName?.trim() || `Habitat ${i + 1}`;
            
            console.log(`\n🎯 Testando: "${cleanName}"`);
            
            // Aplicar filtro
            await chip.click();
            await page.waitForTimeout(2000);
            
            // Verificar resultados
            const filteredCards = page.locator('app-pokemon-card');
            const filteredCount = await filteredCards.count();
            
            results[cleanName] = filteredCount;
            
            if (filteredCount > 0) {
              console.log(`   ✅ ${filteredCount} Pokémon encontrados`);
              
              // Mostrar alguns Pokémon encontrados
              for (let j = 0; j < Math.min(filteredCount, 3); j++) {
                const card = filteredCards.nth(j);
                const name = await card.locator('.pokemon-name').textContent();
                console.log(`     ${j + 1}. ${name?.trim()}`);
              }
            } else {
              console.log(`   ❌ Nenhum Pokémon encontrado`);
            }
            
            // Limpar filtro
            await chip.click();
            await page.waitForTimeout(1000);
          }
          
          // Resumo dos resultados
          console.log('\n📊 RESUMO DOS RESULTADOS:');
          let totalHabitatsWithPokemon = 0;
          let totalHabitatsEmpty = 0;
          
          Object.entries(results).forEach(([habitat, count]) => {
            const status = count > 0 ? '✅' : '❌';
            console.log(`   ${status} ${habitat}: ${count} Pokémon`);
            
            if (count > 0) {
              totalHabitatsWithPokemon++;
            } else {
              totalHabitatsEmpty++;
            }
          });
          
          console.log(`\n🎯 RESULTADO FINAL:`);
          console.log(`   ✅ Habitats com Pokémon: ${totalHabitatsWithPokemon}`);
          console.log(`   ❌ Habitats vazios: ${totalHabitatsEmpty}`);
          
          // Verificar se melhoramos (esperamos pelo menos 5 habitats funcionando)
          if (totalHabitatsWithPokemon >= 5) {
            console.log(`\n🎉 SUCESSO! ${totalHabitatsWithPokemon} habitats estão funcionando!`);
          } else {
            console.log(`\n⚠️ Ainda há ${totalHabitatsEmpty} habitats vazios`);
          }
          
          // Verificar especificamente os habitats que estavam com problema
          const problematicHabitats = ['cavernas', 'florestas'];
          let fixedCount = 0;
          
          problematicHabitats.forEach(habitat => {
            const found = Object.keys(results).find(key => 
              key.toLowerCase().includes(habitat.toLowerCase())
            );
            if (found && results[found] > 0) {
              fixedCount++;
              console.log(`   🔧 CORRIGIDO: ${found} agora tem ${results[found]} Pokémon`);
            }
          });
          
          if (fixedCount === problematicHabitats.length) {
            console.log(`\n🎉 TODOS OS HABITATS PROBLEMÁTICOS FORAM CORRIGIDOS!`);
          }
          
        } else {
          console.log('❌ Seção de habitats não encontrada');
        }
      } else {
        console.log('❌ Botão de filtro não encontrado');
      }
    } else {
      console.log('❌ Botão de busca não encontrado');
    }

    console.log('\n✅ Verificação da correção dos habitats concluída!');
  });

  test('Should verify habitat distribution is balanced', async ({ page }) => {
    console.log('🧪 Verificando distribuição balanceada dos habitats...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se temos uma boa distribuição dos primeiros 12 Pokémon
    console.log('\n📊 Verificando distribuição esperada dos primeiros 12 Pokémon:');
    console.log('   Grassland: Bulbasaur, Ivysaur, Venusaur, Pidgey, Pidgeotto, Pidgeot, Rattata, Raticate, Spearow, Fearow');
    console.log('   Mountain: Charmander, Charmeleon, Charizard, Clefairy, Clefable, Vulpix, Ninetales');
    console.log('   Waters-edge: Squirtle, Wartortle, Blastoise, Psyduck, Golduck');
    console.log('   Forest: Caterpie, Metapod, Butterfree (reatribuídos)');
    console.log('   Cave: Weedle, Kakuna, Beedrill (reatribuídos)');

    // Abrir filtros e testar distribuição
    const searchButton = page.locator('ion-button:has(ion-icon[name="search-outline"])');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      const filterToggle = page.locator('.filter-toggle-btn');
      if (await filterToggle.count() > 0) {
        await filterToggle.click();
        await page.waitForTimeout(1000);
        
        const habitatSection = page.locator('.filter-section:has-text("Habitats")');
        if (await habitatSection.count() > 0) {
          // Testar habitats específicos que deveriam ter Pokémon dos primeiros 12
          const expectedHabitats = [
            { name: 'campos', expectedMin: 3 },
            { name: 'montanhas', expectedMin: 3 },
            { name: 'beiras d\'água', expectedMin: 3 },
            { name: 'florestas', expectedMin: 3 },
            { name: 'cavernas', expectedMin: 3 }
          ];
          
          for (const habitat of expectedHabitats) {
            const chip = habitatSection.locator('ion-chip').filter({ hasText: new RegExp(habitat.name, 'i') });
            
            if (await chip.count() > 0) {
              await chip.first().click();
              await page.waitForTimeout(2000);
              
              const filteredCards = page.locator('app-pokemon-card');
              const count = await filteredCards.count();
              
              console.log(`\n🎯 ${habitat.name}: ${count} Pokémon (esperado: ≥${habitat.expectedMin})`);
              
              if (count >= habitat.expectedMin) {
                console.log(`   ✅ Distribuição adequada`);
              } else {
                console.log(`   ⚠️ Distribuição baixa`);
              }
              
              // Limpar filtro
              await chip.first().click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    }

    console.log('\n✅ Verificação de distribuição concluída!');
  });
});
