import { test, expect } from '@playwright/test';

/**
 * Teste para Verificar e Corrigir Problemas na Aba Evolution
 * Identifica problemas de interpolação e template binding
 */
test.describe('🧪 Teste de Correção da Aba Evolution', () => {
  test('Deve verificar se aba Evolution tem problemas de interpolação', async ({ page }) => {
    console.log('🧪 Investigando problemas na aba Evolution...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Abrir modal do primeiro Pokémon
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    console.log(`📱 Abrindo modal de: ${pokemonName}`);
    
    await firstCard.click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();

    // Navegar para aba Evolution
    console.log('\n🔄 Navegando para aba Evolution...');
    const evolutionTab = modal.locator('[role="tab"]').filter({ hasText: /Evolução|Evolution/ });
    
    if (await evolutionTab.count() > 0) {
      await evolutionTab.click();
      await page.waitForTimeout(5000); // Aguardar carregamento

      // Verificar se há problemas de interpolação
      console.log('\n🔍 Verificando problemas de interpolação...');
      
      // Procurar por texto não interpolado ({{}} syntax)
      const rawTemplateText = await modal.locator('text=/\\{\\{.*\\}\\}/').count();
      if (rawTemplateText > 0) {
        console.log(`❌ PROBLEMA ENCONTRADO: ${rawTemplateText} interpolações não processadas`);
        
        // Capturar exemplos
        const examples = await modal.locator('text=/\\{\\{.*\\}\\}/').allTextContents();
        examples.forEach((example, index) => {
          console.log(`   ${index + 1}. "${example}"`);
        });
      } else {
        console.log('✅ Nenhuma interpolação não processada encontrada');
      }

      // Verificar conteúdo da aba Evolution
      console.log('\n📊 Analisando conteúdo da aba Evolution...');
      
      const evolutionContent = modal.locator('.evolution-content');
      if (await evolutionContent.count() > 0) {
        console.log('✅ Container de evolução encontrado');
        
        // Verificar se há loading
        const loadingSpinner = evolutionContent.locator('ion-spinner');
        if (await loadingSpinner.count() > 0) {
          console.log('⏳ Loading spinner presente - aguardando...');
          await page.waitForTimeout(3000);
        }

        // Verificar cadeia de evolução
        const evolutionChain = evolutionContent.locator('.evolution-chain');
        if (await evolutionChain.count() > 0) {
          console.log('✅ Cadeia de evolução encontrada');
          
          // Verificar estágios de evolução
          const evolutionStages = evolutionChain.locator('.evolution-stage');
          const stageCount = await evolutionStages.count();
          console.log(`📊 ${stageCount} estágios de evolução encontrados`);
          
          // Verificar cada estágio
          for (let i = 0; i < stageCount; i++) {
            const stage = evolutionStages.nth(i);
            
            // Verificar nome do Pokémon
            const stageName = stage.locator('h4');
            if (await stageName.count() > 0) {
              const nameText = await stageName.textContent();
              if (nameText?.includes('{{') || nameText?.includes('}}')) {
                console.log(`❌ PROBLEMA: Nome não interpolado no estágio ${i + 1}: "${nameText}"`);
              } else {
                console.log(`✅ Estágio ${i + 1}: ${nameText}`);
              }
            }
            
            // Verificar imagem
            const stageImage = stage.locator('img');
            if (await stageImage.count() > 0) {
              const imageSrc = await stageImage.getAttribute('src');
              if (imageSrc?.includes('{{') || imageSrc?.includes('}}')) {
                console.log(`❌ PROBLEMA: Src de imagem não interpolado no estágio ${i + 1}`);
              }
            }
            
            // Verificar nível de evolução
            const evolutionLevel = stage.locator('.evolution-level');
            if (await evolutionLevel.count() > 0) {
              const levelText = await evolutionLevel.textContent();
              if (levelText?.includes('{{') || levelText?.includes('}}')) {
                console.log(`❌ PROBLEMA: Nível não interpolado: "${levelText}"`);
              }
            }
          }
          
        } else {
          // Verificar se há mensagem de "não evolui"
          const noEvolution = evolutionContent.locator('.no-evolution');
          if (await noEvolution.count() > 0) {
            console.log('ℹ️ Pokémon não evolui - mensagem exibida corretamente');
          } else {
            console.log('⚠️ Nenhuma cadeia de evolução ou mensagem encontrada');
          }
        }

        // Verificar informações adicionais
        const evolutionDetails = evolutionContent.locator('.evolution-details');
        if (await evolutionDetails.count() > 0) {
          console.log('✅ Detalhes de evolução encontrados');
          
          // Verificar se há problemas de interpolação nos detalhes
          const detailsText = await evolutionDetails.textContent();
          if (detailsText?.includes('{{') || detailsText?.includes('}}')) {
            console.log('❌ PROBLEMA: Interpolação não processada nos detalhes');
          }
        }

      } else {
        console.log('❌ PROBLEMA: Container de evolução não encontrado');
      }

      // Verificar se há erros no console
      console.log('\n🔍 Verificando erros no console...');
      const consoleLogs = await page.evaluate(() => {
        return (window as any).consoleErrors || [];
      });
      
      if (consoleLogs.length > 0) {
        console.log(`⚠️ ${consoleLogs.length} erros no console encontrados`);
      }

    } else {
      console.log('❌ PROBLEMA: Aba Evolution não encontrada');
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    console.log('\n📋 Investigação da aba Evolution concluída');
  });

  test('Deve testar múltiplos Pokémon para verificar consistência da aba Evolution', async ({ page }) => {
    console.log('🧪 Testando aba Evolution em múltiplos Pokémon...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    const pokemonToTest = Math.min(3, cardCount);

    for (let i = 0; i < pokemonToTest; i++) {
      console.log(`\n🎯 Testando Pokémon ${i + 1}/${pokemonToTest}`);
      
      const card = cards.nth(i);
      const pokemonName = await card.locator('.pokemon-name').textContent();
      console.log(`📱 Pokémon: ${pokemonName}`);

      // Abrir modal
      await card.click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
      
      const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

      // Navegar para aba Evolution
      const evolutionTab = modal.locator('[role="tab"]').filter({ hasText: /Evolução|Evolution/ });
      
      if (await evolutionTab.count() > 0) {
        await evolutionTab.click();
        await page.waitForTimeout(3000);

        // Verificar se carregou sem problemas
        const evolutionContent = modal.locator('.evolution-content');
        if (await evolutionContent.count() > 0) {
          // Verificar se há interpolações não processadas
          const rawInterpolations = await evolutionContent.locator('text=/\\{\\{.*\\}\\}/').count();
          
          if (rawInterpolations > 0) {
            console.log(`❌ ${pokemonName}: ${rawInterpolations} interpolações não processadas`);
          } else {
            console.log(`✅ ${pokemonName}: Aba Evolution OK`);
          }
        } else {
          console.log(`⚠️ ${pokemonName}: Conteúdo de evolução não encontrado`);
        }
      }

      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    console.log('\n🎉 Teste de múltiplos Pokémon concluído');
  });
});
