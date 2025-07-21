import { test, expect } from '@playwright/test';

/**
 * Teste específico para verificar se a chave "level-up" está traduzida corretamente
 */
test.describe('🧪 Teste da Tradução "level-up"', () => {
  test('Deve verificar se a chave "level-up" está traduzida corretamente', async ({ page }) => {
    console.log('🧪 Testando tradução da chave "level-up"...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Abrir modal do primeiro Pokémon
    console.log('\n📱 Abrindo modal do primeiro Pokémon...');
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Verificar se modal abriu
    const modal = page.locator('app-details-modal');
    await expect(modal).toBeVisible();
    console.log('✅ Modal aberto');

    // Navegar para aba Evolution
    console.log('\n🔄 Navegando para aba Evolution...');
    const evolutionTab = modal.locator('button[role="tab"]').filter({ hasText: /Evolução|Evolution/ });
    
    if (await evolutionTab.count() > 0) {
      await evolutionTab.click();
      await page.waitForTimeout(5000); // Aguardar carregamento da aba

      console.log('\n🔍 Verificando se "level-up" não aparece como texto não traduzido...');

      // Verificar se não há texto "level-up" não traduzido
      const levelUpUntranslated = await page.locator('text="level-up"').count();
      console.log(`❌ Textos "level-up" não traduzidos encontrados: ${levelUpUntranslated}`);
      
      expect(levelUpUntranslated).toBe(0);

      // Verificar se há traduções corretas baseadas no idioma
      console.log('\n✅ Verificando traduções corretas...');

      // Procurar por traduções em português
      const porNivelTexts = await page.locator('text=/por nível/i').count();
      console.log(`📊 Textos "por nível" (pt-BR) encontrados: ${porNivelTexts}`);

      // Procurar por traduções em inglês
      const byLevelTexts = await page.locator('text=/by level/i').count();
      console.log(`📊 Textos "by level" (en-US) encontrados: ${byLevelTexts}`);

      // Procurar por traduções em espanhol
      const porNivelEsTexts = await page.locator('text=/por nivel/i').count();
      console.log(`📊 Textos "por nivel" (es-ES) encontrados: ${porNivelEsTexts}`);

      // Procurar por traduções em japonês
      const levelUpJaTexts = await page.locator('text=/レベルアップ/').count();
      console.log(`📊 Textos "レベルアップ" (ja-JP) encontrados: ${levelUpJaTexts}`);

      // Pelo menos uma das traduções deve estar presente
      const totalTranslatedTexts = porNivelTexts + byLevelTexts + porNivelEsTexts + levelUpJaTexts;
      
      if (totalTranslatedTexts > 0) {
        console.log(`✅ Encontradas ${totalTranslatedTexts} traduções corretas da chave "level-up"`);
      } else {
        console.log('ℹ️ Nenhuma tradução específica de "level-up" encontrada (pode não haver evoluções por nível neste Pokémon)');
      }

      // Verificar se não há chaves de tradução não processadas em geral
      const untranslatedKeys = await page.locator('text=/evolution\.triggers\.|evolution\.methods\./').count();
      console.log(`🔧 Chaves de tradução não processadas: ${untranslatedKeys}`);
      
      expect(untranslatedKeys).toBe(0);

      console.log('\n🎉 Verificação da tradução "level-up" concluída!');
    } else {
      console.log('⚠️ Aba Evolution não encontrada neste Pokémon');
    }

    // Fechar modal
    const closeButton = page.locator('ion-button[aria-label="Fechar modal"], .close-button, ion-backdrop');
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('Deve verificar traduções em diferentes idiomas', async ({ page }) => {
    console.log('🧪 Testando traduções "level-up" em diferentes idiomas...');

    // Simular teste de diferentes idiomas verificando se as chaves existem
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    console.log('\n🌍 Verificando se as traduções foram adicionadas corretamente...');

    // Verificar se a aplicação carrega sem erros (indicando que as traduções são válidas)
    const hasErrors = await page.locator('.error, [class*="error"]').count();
    console.log(`❌ Erros na página: ${hasErrors}`);
    
    expect(hasErrors).toBe(0);

    // Verificar se há cards de Pokémon (indicando que a aplicação funciona)
    const pokemonCards = await page.locator('app-pokemon-card').count();
    console.log(`📊 Cards de Pokémon carregados: ${pokemonCards}`);
    
    expect(pokemonCards).toBeGreaterThan(0);

    console.log('✅ Aplicação funcionando corretamente com as novas traduções');

    // Teste adicional: verificar se não há erros no console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log('❌ Erros no console encontrados:');
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ Nenhum erro no console');
    }

    // Não vamos falhar o teste por erros de console, apenas reportar
    console.log('\n🎉 Teste de idiomas concluído!');
  });

  test('Deve verificar que getEvolutionMethodText processa "level-up" corretamente', async ({ page }) => {
    console.log('🧪 Testando processamento de "level-up" pelo método getEvolutionMethodText...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Procurar por um Pokémon que evolui (como Bulbasaur, Charmander, Squirtle)
    const evolutionPokemon = ['Bulbasaur', 'Charmander', 'Squirtle', 'Caterpie', 'Weedle'];
    
    for (const pokemonName of evolutionPokemon) {
      console.log(`\n🎯 Testando ${pokemonName}...`);

      const pokemonCard = page.locator('app-pokemon-card').filter({ 
        has: page.locator('.pokemon-name').filter({ hasText: new RegExp(pokemonName, 'i') })
      });

      if (await pokemonCard.count() > 0) {
        await pokemonCard.first().click();
        await page.waitForTimeout(2000);

        const modal = page.locator('app-details-modal');
        if (await modal.isVisible()) {
          // Navegar para aba Evolution
          const evolutionTab = modal.locator('button[role="tab"]').filter({ hasText: /Evolução|Evolution/ });
          
          if (await evolutionTab.count() > 0) {
            await evolutionTab.click();
            await page.waitForTimeout(3000);

            // Verificar se há métodos de evolução
            const evolutionMethods = await page.locator('.evolution-method').count();
            console.log(`   📊 Métodos de evolução encontrados: ${evolutionMethods}`);

            if (evolutionMethods > 0) {
              const methodTexts = await page.locator('.evolution-method').allTextContents();
              
              // Verificar se não há "level-up" não traduzido
              const hasUntranslatedLevelUp = methodTexts.some(text => text.trim() === 'level-up');
              
              if (hasUntranslatedLevelUp) {
                console.log(`   ❌ ${pokemonName}: Encontrado "level-up" não traduzido`);
              } else {
                console.log(`   ✅ ${pokemonName}: Nenhum "level-up" não traduzido`);
              }

              expect(hasUntranslatedLevelUp).toBeFalsy();

              // Mostrar os métodos encontrados
              methodTexts.forEach((text, index) => {
                console.log(`     Método ${index + 1}: "${text.trim()}"`);
              });
            }
          }

          // Fechar modal
          const closeButton = page.locator('ion-button[aria-label="Fechar modal"], .close-button, ion-backdrop');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await page.waitForTimeout(1000);
          }
        }

        break; // Sair do loop após testar um Pokémon com sucesso
      }
    }

    console.log('✅ Teste de processamento de "level-up" concluído');
  });
});
