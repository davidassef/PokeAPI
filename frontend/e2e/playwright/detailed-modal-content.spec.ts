import { test, expect } from '@playwright/test';

/**
 * Teste Detalhado do Conteúdo do Modal
 * Verifica cada elemento específico de cada aba
 */
test.describe('🔬 Análise Detalhada do Conteúdo do Modal', () => {
  test('Deve analisar detalhadamente cada aba do modal', async ({ page }) => {
    console.log('🔬 Iniciando análise detalhada do modal...');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Abrir modal
    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    console.log(`🎯 Analisando modal de: ${pokemonName}`);
    
    await firstCard.click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // === ABA 1: VISÃO GERAL ===
    console.log('\n📊 === ANÁLISE DETALHADA: VISÃO GERAL ===');
    const overviewTab = modal.locator('[role="tab"]').first();
    await overviewTab.click();
    await page.waitForTimeout(2000);

    // Verificar nome e número
    const pokemonTitle = await modal.locator('h1').textContent();
    console.log(`🏷️ Nome: ${pokemonTitle}`);

    // Buscar número do Pokémon
    const pokemonNumber = await modal.locator('text=/#\\d+/').first().textContent().catch(() => 'Não encontrado');
    console.log(`🔢 Número: ${pokemonNumber}`);

    // Verificar tipos detalhadamente
    console.log('\n🏷️ Análise de Tipos:');
    const typeElements = modal.locator('.pokemon-type, .type-chip, .type-badge, .type');
    const typeCount = await typeElements.count();
    
    for (let i = 0; i < typeCount; i++) {
      const typeElement = typeElements.nth(i);
      const typeText = await typeElement.textContent();
      const typeColor = await typeElement.evaluate(el => window.getComputedStyle(el).backgroundColor);
      console.log(`   Tipo ${i + 1}: ${typeText?.trim()} (cor: ${typeColor})`);
    }

    // Verificar estatísticas físicas
    console.log('\n📏 Estatísticas Físicas:');
    const heightElement = modal.locator('text=/altura|height/i').first();
    const weightElement = modal.locator('text=/peso|weight/i').first();
    
    if (await heightElement.count() > 0) {
      const heightText = await heightElement.textContent();
      console.log(`   📐 ${heightText}`);
    }
    
    if (await weightElement.count() > 0) {
      const weightText = await weightElement.textContent();
      console.log(`   ⚖️ ${weightText}`);
    }

    // Verificar estatísticas de combate
    console.log('\n⚔️ Estatísticas de Combate:');
    const statNames = ['HP', 'Attack', 'Defense', 'Sp. Attack', 'Sp. Defense', 'Speed'];
    
    for (const statName of statNames) {
      const statElement = modal.locator(`text=/${statName}/i`).first();
      if (await statElement.count() > 0) {
        const statContainer = statElement.locator('..').first();
        const statValue = await statContainer.locator('text=/\\d+/').first().textContent().catch(() => 'N/A');
        console.log(`   ${statName}: ${statValue}`);
      }
    }

    // === ABA 2: COMBATE ===
    console.log('\n⚔️ === ANÁLISE DETALHADA: COMBATE ===');
    const combatTab = modal.locator('[role="tab"]').nth(1);
    await combatTab.click();
    await page.waitForTimeout(2000);

    // Verificar habilidades
    console.log('\n🎯 Habilidades:');
    const abilities = modal.locator('.ability, .habilidade');
    const abilityCount = await abilities.count();
    
    if (abilityCount > 0) {
      for (let i = 0; i < abilityCount; i++) {
        const ability = abilities.nth(i);
        const abilityName = await ability.textContent();
        console.log(`   Habilidade ${i + 1}: ${abilityName?.trim()}`);
      }
    } else {
      console.log('   ℹ️ Buscando habilidades com seletores alternativos...');
      const altAbilities = modal.locator('text=/habilidade|ability/i');
      const altCount = await altAbilities.count();
      console.log(`   📋 ${altCount} referências a habilidades encontradas`);
    }

    // Verificar movimentos
    console.log('\n🥊 Movimentos:');
    const moves = modal.locator('.move, .movimento, .attack');
    const moveCount = await moves.count();
    
    if (moveCount > 0) {
      console.log(`   📋 ${moveCount} movimentos encontrados`);
      for (let i = 0; i < Math.min(moveCount, 5); i++) {
        const move = moves.nth(i);
        const moveName = await move.textContent();
        console.log(`   ${i + 1}. ${moveName?.trim()}`);
      }
    } else {
      console.log('   ℹ️ Movimentos podem estar em formato diferente');
    }

    // Verificar efetividades de tipo
    console.log('\n🎯 Efetividades de Tipo:');
    const effectiveness = modal.locator('.effectiveness, .type-effectiveness, .weakness, .resistance');
    const effCount = await effectiveness.count();
    
    if (effCount > 0) {
      console.log(`   📊 ${effCount} informações de efetividade encontradas`);
    } else {
      // Buscar por texto relacionado
      const weaknessText = modal.locator('text=/fraco|weak|efetivo/i');
      const weakCount = await weaknessText.count();
      console.log(`   📋 ${weakCount} referências a efetividades encontradas`);
    }

    // === ABA 3: EVOLUÇÃO ===
    console.log('\n🔄 === ANÁLISE DETALHADA: EVOLUÇÃO ===');
    const evolutionTab = modal.locator('[role="tab"]').nth(2);
    await evolutionTab.click();
    await page.waitForTimeout(2000);

    // Verificar cadeia evolutiva
    console.log('\n🔗 Cadeia Evolutiva:');
    const evolutionStages = modal.locator('.evolution-stage, .evolution, .pokemon-evolution');
    const stageCount = await evolutionStages.count();
    
    if (stageCount > 0) {
      console.log(`   📊 ${stageCount} estágios evolutivos encontrados`);
      
      for (let i = 0; i < stageCount; i++) {
        const stage = evolutionStages.nth(i);
        const stageName = await stage.locator('.pokemon-name, h3, h4').first().textContent().catch(() => 'Nome não encontrado');
        console.log(`   Estágio ${i + 1}: ${stageName}`);
        
        // Verificar imagem da evolução
        const evolutionImage = stage.locator('img');
        if (await evolutionImage.count() > 0) {
          const imageSrc = await evolutionImage.getAttribute('src');
          console.log(`      🖼️ Imagem: ${imageSrc?.substring(0, 50)}...`);
        }
      }
    }

    // Verificar condições de evolução
    console.log('\n📋 Condições de Evolução:');
    const conditions = modal.locator('.evolution-condition, .requirement, .condition');
    const conditionCount = await conditions.count();
    
    if (conditionCount > 0) {
      for (let i = 0; i < conditionCount; i++) {
        const condition = conditions.nth(i);
        const conditionText = await condition.textContent();
        console.log(`   Condição ${i + 1}: ${conditionText?.trim()}`);
      }
    } else {
      // Buscar por texto de nível
      const levelText = modal.locator('text=/nível|level|lv/i');
      const levelCount = await levelText.count();
      if (levelCount > 0) {
        console.log(`   📊 ${levelCount} referências a níveis encontradas`);
      }
    }

    // === ABA 4: CURIOSIDADES ===
    console.log('\n🎭 === ANÁLISE DETALHADA: CURIOSIDADES ===');
    const curiositiesTab = modal.locator('[role="tab"]').nth(3);
    await curiositiesTab.click();
    await page.waitForTimeout(2000);

    // Verificar flavor texts
    console.log('\n📖 Textos de Curiosidades:');
    const flavorTexts = modal.locator('.flavor-text, .description, .curiosity, .pokemon-description');
    const flavorCount = await flavorTexts.count();
    
    if (flavorCount > 0) {
      for (let i = 0; i < flavorCount; i++) {
        const flavorText = flavorTexts.nth(i);
        const text = await flavorText.textContent();
        if (text && text.trim().length > 10) {
          console.log(`   📝 Texto ${i + 1}: "${text.trim().substring(0, 80)}..."`);
        }
      }
    } else {
      // Buscar por parágrafos com texto longo
      const paragraphs = modal.locator('p');
      const pCount = await paragraphs.count();
      console.log(`   📋 ${pCount} parágrafos encontrados para análise`);
      
      for (let i = 0; i < Math.min(pCount, 3); i++) {
        const p = paragraphs.nth(i);
        const text = await p.textContent();
        if (text && text.trim().length > 20) {
          console.log(`   📝 Parágrafo ${i + 1}: "${text.trim().substring(0, 60)}..."`);
        }
      }
    }

    // Verificar habitat
    console.log('\n🏞️ Habitat:');
    const habitat = modal.locator('.habitat, .location');
    if (await habitat.count() > 0) {
      const habitatText = await habitat.first().textContent();
      console.log(`   🌍 ${habitatText}`);
    } else {
      const habitatRef = modal.locator('text=/habitat|local|região/i');
      const habitatRefCount = await habitatRef.count();
      console.log(`   📋 ${habitatRefCount} referências a habitat encontradas`);
    }

    // Verificar categoria/espécie
    console.log('\n🏷️ Categoria/Espécie:');
    const species = modal.locator('.species, .category, .pokemon-species');
    if (await species.count() > 0) {
      const speciesText = await species.first().textContent();
      console.log(`   🔖 ${speciesText}`);
    }

    // === ANÁLISE GERAL DO MODAL ===
    console.log('\n📊 === ANÁLISE GERAL DO MODAL ===');
    
    // Contar todos os elementos interativos
    const allButtons = modal.locator('button, ion-button');
    const buttonCount = await allButtons.count();
    console.log(`🔘 Total de botões: ${buttonCount}`);

    // Contar todas as imagens
    const allImages = modal.locator('img');
    const imageCount = await allImages.count();
    console.log(`🖼️ Total de imagens: ${imageCount}`);

    // Verificar responsividade
    console.log('\n📱 Teste de Responsividade:');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const modalStillVisible = await modal.isVisible();
    console.log(`   📱 Modal visível em tablet: ${modalStillVisible}`);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const modalVisibleMobile = await modal.isVisible();
    console.log(`   📱 Modal visível em mobile: ${modalVisibleMobile}`);

    // Restaurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Fechar modal
    console.log('\n🚪 Fechando modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    const modalClosed = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count() === 0;
    console.log(`✅ Modal fechado: ${modalClosed}`);

    console.log('\n🎉 Análise detalhada concluída!');
  });
});
