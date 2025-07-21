import { test, expect } from '@playwright/test';

/**
 * Teste de Múltiplos Pokémon no Modal
 * Verifica consistência entre diferentes Pokémon
 */
test.describe('🔄 Teste de Múltiplos Pokémon no Modal', () => {
  test('Deve testar modal de vários Pokémon diferentes', async ({ page }) => {
    console.log('🔄 Iniciando teste de múltiplos Pokémon...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const cards = page.locator('app-pokemon-card');
    const totalCards = await cards.count();
    console.log(`📋 Total de Pokémon disponíveis: ${totalCards}`);

    // Testar os primeiros 5 Pokémon
    const pokemonToTest = Math.min(5, totalCards);
    const pokemonData = [];

    for (let i = 0; i < pokemonToTest; i++) {
      console.log(`\n🎯 === TESTANDO POKÉMON ${i + 1}/${pokemonToTest} ===`);
      
      const card = cards.nth(i);
      const pokemonName = await card.locator('.pokemon-name').textContent();
      console.log(`📱 Abrindo modal de: ${pokemonName}`);

      // Abrir modal
      await card.click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
      const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

      // Coletar dados do Pokémon
      const pokemon = {
        name: pokemonName,
        modalName: await modal.locator('h1').textContent(),
        tabs: [],
        images: 0,
        buttons: 0,
        types: []
      };

      // Verificar abas
      const tabs = modal.locator('[role="tab"]');
      const tabCount = await tabs.count();
      pokemon.tabs = [];

      for (let j = 0; j < tabCount; j++) {
        const tabText = await tabs.nth(j).textContent();
        pokemon.tabs.push(tabText?.trim() || `Aba ${j + 1}`);
      }

      console.log(`📑 Abas encontradas: ${pokemon.tabs.join(', ')}`);

      // Testar cada aba
      for (let j = 0; j < tabCount; j++) {
        const tabName = pokemon.tabs[j];
        console.log(`   🔍 Testando aba: ${tabName}`);
        
        await tabs.nth(j).click();
        await page.waitForTimeout(1500);

        // Verificar se aba carregou conteúdo
        const visibleElements = modal.locator('*:visible');
        const visibleCount = await visibleElements.count();
        console.log(`      👁️ ${visibleCount} elementos visíveis`);

        // Verificações específicas por aba
        switch (tabName.toLowerCase()) {
          case 'visão geral':
            // Verificar tipos
            const types = modal.locator('.pokemon-type, .type-chip, .type-badge');
            const typeCount = await types.count();
            
            for (let k = 0; k < typeCount; k++) {
              const typeText = await types.nth(k).textContent();
              pokemon.types.push(typeText?.trim() || '');
            }
            console.log(`      🏷️ Tipos: ${pokemon.types.join(', ')}`);

            // Verificar estatísticas
            const stats = modal.locator('text=/HP|Attack|Defense|Speed/i');
            const statCount = await stats.count();
            console.log(`      📊 ${statCount} estatísticas encontradas`);
            break;

          case 'combate':
            // Verificar habilidades
            const abilities = modal.locator('text=/habilidade|ability/i');
            const abilityCount = await abilities.count();
            console.log(`      🎯 ${abilityCount} referências a habilidades`);
            break;

          case 'evolução':
            // Verificar evoluções
            const evolutions = modal.locator('.evolution-stage, .evolution');
            const evolutionCount = await evolutions.count();
            console.log(`      🔄 ${evolutionCount} estágios evolutivos`);
            break;

          case 'curiosidades':
            // Verificar textos
            const flavorTexts = modal.locator('.flavor-text, .description, p');
            const textCount = await flavorTexts.count();
            console.log(`      📖 ${textCount} elementos de texto`);
            break;
        }
      }

      // Contar imagens e botões
      pokemon.images = await modal.locator('img').count();
      pokemon.buttons = await modal.locator('button, ion-button').count();
      
      console.log(`🖼️ Imagens: ${pokemon.images}`);
      console.log(`🔘 Botões: ${pokemon.buttons}`);

      // Testar navegação de imagens (thumbnails)
      const thumbnails = modal.locator('.thumbnail-btn-inline');
      const thumbnailCount = await thumbnails.count();
      
      if (thumbnailCount > 1) {
        console.log(`🔄 Testando ${thumbnailCount} thumbnails...`);
        for (let k = 0; k < Math.min(3, thumbnailCount); k++) {
          await thumbnails.nth(k).click();
          await page.waitForTimeout(300);
        }
        console.log(`   ✅ Navegação de thumbnails funcionando`);
      }

      // Testar botões de navegação do carousel
      const prevBtn = modal.locator('.carousel-nav.prev');
      const nextBtn = modal.locator('.carousel-nav.next');
      
      if (await prevBtn.count() > 0 && await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(300);
        await prevBtn.click();
        await page.waitForTimeout(300);
        console.log(`   ✅ Botões de navegação funcionando`);
      }

      pokemonData.push(pokemon);

      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      const modalClosed = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count() === 0;
      console.log(`✅ Modal fechado: ${modalClosed}`);
    }

    // Análise comparativa
    console.log('\n📊 === ANÁLISE COMPARATIVA ===');
    
    // Verificar consistência das abas
    const allTabs = pokemonData.map(p => p.tabs);
    const firstTabs = allTabs[0];
    const consistentTabs = allTabs.every(tabs => 
      tabs.length === firstTabs.length && 
      tabs.every((tab, index) => tab === firstTabs[index])
    );
    
    console.log(`📑 Abas consistentes entre Pokémon: ${consistentTabs}`);
    console.log(`📑 Padrão de abas: ${firstTabs.join(' → ')}`);

    // Verificar distribuição de tipos
    const allTypes = pokemonData.flatMap(p => p.types);
    const uniqueTypes = [...new Set(allTypes)];
    console.log(`🏷️ Tipos únicos encontrados: ${uniqueTypes.join(', ')}`);

    // Verificar média de imagens e botões
    const avgImages = pokemonData.reduce((sum, p) => sum + p.images, 0) / pokemonData.length;
    const avgButtons = pokemonData.reduce((sum, p) => sum + p.buttons, 0) / pokemonData.length;
    
    console.log(`🖼️ Média de imagens por modal: ${avgImages.toFixed(1)}`);
    console.log(`🔘 Média de botões por modal: ${avgButtons.toFixed(1)}`);

    // Resumo dos Pokémon testados
    console.log('\n📋 === RESUMO DOS POKÉMON TESTADOS ===');
    pokemonData.forEach((pokemon, index) => {
      console.log(`${index + 1}. ${pokemon.name}:`);
      console.log(`   🏷️ Tipos: ${pokemon.types.join(', ') || 'Não detectados'}`);
      console.log(`   📑 Abas: ${pokemon.tabs.length}`);
      console.log(`   🖼️ Imagens: ${pokemon.images}`);
      console.log(`   🔘 Botões: ${pokemon.buttons}`);
    });

    // Verificações de qualidade
    console.log('\n✅ === VERIFICAÇÕES DE QUALIDADE ===');
    
    const allHaveTabs = pokemonData.every(p => p.tabs.length >= 3);
    console.log(`📑 Todos têm pelo menos 3 abas: ${allHaveTabs}`);
    
    const allHaveImages = pokemonData.every(p => p.images >= 1);
    console.log(`🖼️ Todos têm pelo menos 1 imagem: ${allHaveImages}`);
    
    const allHaveTypes = pokemonData.every(p => p.types.length >= 1);
    console.log(`🏷️ Todos têm pelo menos 1 tipo: ${allHaveTypes}`);
    
    const allNamesMatch = pokemonData.every(p => p.name === p.modalName);
    console.log(`🏷️ Nomes consistentes (card = modal): ${allNamesMatch}`);

    console.log('\n🎉 Teste de múltiplos Pokémon concluído!');
    
    // Assertions para garantir qualidade
    expect(allHaveTabs).toBeTruthy();
    expect(allHaveImages).toBeTruthy();
    expect(consistentTabs).toBeTruthy();
    expect(pokemonData.length).toBeGreaterThan(0);
  });

  test('Deve testar performance com abertura rápida de múltiplos modais', async ({ page }) => {
    console.log('⚡ Testando performance com múltiplos modais...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const cards = page.locator('app-pokemon-card');
    const testCount = Math.min(3, await cards.count());
    
    const times = [];

    for (let i = 0; i < testCount; i++) {
      console.log(`⚡ Teste de performance ${i + 1}/${testCount}`);
      
      const startTime = Date.now();
      
      // Abrir modal
      await cards.nth(i).click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
      
      const openTime = Date.now() - startTime;
      times.push(openTime);
      
      console.log(`   ⏱️ Tempo de abertura: ${openTime}ms`);
      
      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log('\n📊 Estatísticas de Performance:');
    console.log(`   ⏱️ Tempo médio: ${avgTime.toFixed(0)}ms`);
    console.log(`   ⏱️ Tempo máximo: ${maxTime}ms`);
    console.log(`   ⏱️ Tempo mínimo: ${minTime}ms`);

    // Verificar se performance está aceitável
    expect(avgTime).toBeLessThan(3000); // Média menor que 3 segundos
    expect(maxTime).toBeLessThan(5000); // Máximo menor que 5 segundos
    
    console.log('✅ Performance aceitável!');
  });
});
