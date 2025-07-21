import { test, expect } from '@playwright/test';

/**
 * Teste de Correção das Traduções da Aba Evolution
 * Verifica se as chaves não traduzidas foram corrigidas
 */
test.describe('🧪 Correção das Traduções da Aba Evolution', () => {
  test('Deve verificar se traduções da aba Evolution estão funcionando corretamente', async ({ page }) => {
    console.log('🧪 Testando correção das traduções na aba Evolution...');

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
    const evolutionTab = modal.locator('button.tab-btn').filter({ hasText: /Evolução|Evolution/ });

    if (await evolutionTab.count() > 0) {
      await evolutionTab.click();
      await page.waitForTimeout(5000); // Aguardar carregamento da aba

      console.log('\n🔍 Verificando traduções na aba Evolution...');

      // Verificar se não há chaves não traduzidas
      const untranslatedKeys = await page.locator('text=/modal\\.level|level-up/').count();
      console.log(`❌ Chaves não traduzidas encontradas: ${untranslatedKeys}`);

      if (untranslatedKeys > 0) {
        // Capturar exemplos de chaves não traduzidas
        const examples = await page.locator('text=/modal\\.level|level-up/').allTextContents();
        examples.forEach((example, index) => {
          console.log(`   ${index + 1}. "${example}"`);
        });
      }

      expect(untranslatedKeys).toBe(0);

      // Verificar se há textos traduzidos corretamente
      console.log('\n✅ Verificando traduções corretas...');

      // Procurar por "Nível" (português) ou "Level" (inglês)
      const levelTexts = await page.locator('text=/Nível|Level/').count();
      console.log(`📊 Textos "Nível/Level" encontrados: ${levelTexts}`);

      if (levelTexts > 0) {
        const levelExamples = await page.locator('text=/Nível|Level/').allTextContents();
        levelExamples.slice(0, 3).forEach((example, index) => {
          console.log(`   ${index + 1}. "${example.trim()}"`);
        });
      }

      // Verificar se há informações de evolução
      const evolutionInfo = await page.locator('.evolution-info-text, .pokemon-evolution-card').count();
      console.log(`📊 Cards de evolução encontrados: ${evolutionInfo}`);

      if (evolutionInfo > 0) {
        console.log('✅ Informações de evolução presentes');

        // Verificar se há setas de evolução com texto traduzido
        const evolutionArrows = await page.locator('.evolution-arrow .evolution-trigger').count();
        console.log(`🏹 Setas de evolução com texto: ${evolutionArrows}`);

        if (evolutionArrows > 0) {
          const arrowTexts = await page.locator('.evolution-arrow .evolution-trigger').allTextContents();
          arrowTexts.slice(0, 2).forEach((text, index) => {
            console.log(`   Seta ${index + 1}: "${text.trim()}"`);
          });
        }
      }

      // Verificar se não há interpolações não processadas
      const rawInterpolations = await page.locator('text=/\\{\\{.*\\}\\}/').count();
      console.log(`🔧 Interpolações não processadas: ${rawInterpolations}`);

      if (rawInterpolations > 0) {
        const interpolationExamples = await page.locator('text=/\\{\\{.*\\}\\}/').allTextContents();
        interpolationExamples.forEach((example, index) => {
          console.log(`   ${index + 1}. "${example}"`);
        });
      }

      expect(rawInterpolations).toBe(0);

      console.log('\n🎉 Verificação de traduções concluída!');
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

  test('Deve testar traduções em múltiplos Pokémon com evolução', async ({ page }) => {
    console.log('🧪 Testando traduções em múltiplos Pokémon...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const pokemonToTest = ['Bulbasaur', 'Charmander', 'Squirtle'];

    for (const pokemonName of pokemonToTest) {
      console.log(`\n🎯 Testando ${pokemonName}...`);

      // Procurar pelo Pokémon específico
      const pokemonCard = page.locator('app-pokemon-card').filter({
        has: page.locator('.pokemon-name').filter({ hasText: new RegExp(pokemonName, 'i') })
      });

      if (await pokemonCard.count() > 0) {
        await pokemonCard.first().click();
        await page.waitForTimeout(2000);

        const modal = page.locator('app-details-modal');
        if (await modal.isVisible()) {
          // Navegar para aba Evolution
          const evolutionTab = modal.locator('button.tab-btn').filter({ hasText: /Evolução|Evolution/ });

          if (await evolutionTab.count() > 0) {
            await evolutionTab.click();
            await page.waitForTimeout(3000);

            // Verificar traduções
            const untranslatedKeys = await page.locator('text=/modal\\.level|level-up/').count();
            const rawInterpolations = await page.locator('text=/\\{\\{.*\\}\\}/').count();

            console.log(`   📊 ${pokemonName}: ${untranslatedKeys} chaves não traduzidas, ${rawInterpolations} interpolações não processadas`);

            expect(untranslatedKeys).toBe(0);
            expect(rawInterpolations).toBe(0);

            // Verificar se há textos de nível traduzidos
            const levelTexts = await page.locator('text=/Nível \\d+|Level \\d+/').count();
            if (levelTexts > 0) {
              console.log(`   ✅ ${pokemonName}: ${levelTexts} textos de nível traduzidos`);
            }
          }

          // Fechar modal
          const closeButton = page.locator('ion-button[aria-label="Fechar modal"], .close-button, ion-backdrop');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await page.waitForTimeout(1000);
          }
        }
      } else {
        console.log(`   ⚠️ ${pokemonName} não encontrado na página atual`);
      }
    }

    console.log('\n✅ Teste de múltiplos Pokémon concluído');
  });

  test('Deve verificar que método getEvolutionMethodText funciona corretamente', async ({ page }) => {
    console.log('🧪 Testando método getEvolutionMethodText...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Abrir modal de um Pokémon que evolui
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('app-details-modal');
    if (await modal.isVisible()) {
      // Navegar para aba Evolution
      const evolutionTab = modal.locator('button.tab-btn').filter({ hasText: /Evolução|Evolution/ });

      if (await evolutionTab.count() > 0) {
        await evolutionTab.click();
        await page.waitForTimeout(3000);

        console.log('\n🔍 Verificando métodos de evolução...');

        // Verificar se há spans com classe evolution-method
        const evolutionMethods = await page.locator('.evolution-method').count();
        console.log(`📊 Métodos de evolução encontrados: ${evolutionMethods}`);

        if (evolutionMethods > 0) {
          const methodTexts = await page.locator('.evolution-method').allTextContents();
          methodTexts.forEach((text, index) => {
            console.log(`   Método ${index + 1}: "${text.trim()}"`);
          });

          // Verificar se não há textos "level-up" não traduzidos
          const untranslatedMethods = methodTexts.filter(text =>
            text.includes('level-up') || text.includes('evolution.methods.')
          );

          expect(untranslatedMethods.length).toBe(0);

          if (untranslatedMethods.length === 0) {
            console.log('✅ Todos os métodos de evolução estão traduzidos');
          } else {
            console.log('❌ Métodos não traduzidos encontrados:', untranslatedMethods);
          }
        }

        // Verificar triggers de evolução nas setas
        const evolutionTriggers = await page.locator('.evolution-trigger').count();
        console.log(`🏹 Triggers de evolução encontrados: ${evolutionTriggers}`);

        if (evolutionTriggers > 0) {
          const triggerTexts = await page.locator('.evolution-trigger').allTextContents();
          triggerTexts.forEach((text, index) => {
            console.log(`   Trigger ${index + 1}: "${text.trim()}"`);
          });

          // Verificar se não há chaves de tradução não processadas
          const untranslatedTriggers = triggerTexts.filter(text =>
            text.includes('evolution.triggers.') || text.includes('{{') || text.includes('}}')
          );

          expect(untranslatedTriggers.length).toBe(0);

          if (untranslatedTriggers.length === 0) {
            console.log('✅ Todos os triggers de evolução estão traduzidos');
          } else {
            console.log('❌ Triggers não traduzidos encontrados:', untranslatedTriggers);
          }
        }
      }

      // Fechar modal
      const closeButton = page.locator('ion-button[aria-label="Fechar modal"], .close-button, ion-backdrop');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(1000);
      }
    }

    console.log('✅ Teste de métodos de evolução concluído');
  });
});
