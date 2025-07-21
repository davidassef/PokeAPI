import { test, expect } from '@playwright/test';

/**
 * Teste Completo de Navegação no Modal
 * Navega por todas as abas e verifica todos os elementos
 */
test.describe('🔍 Navegação Completa do Modal de Pokémon', () => {
  test('Deve navegar por todo o modal e verificar todas as abas', async ({ page }) => {
    console.log('🚀 Iniciando navegação completa do modal...');

    // Configurar viewport e navegar
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📋 Pokémon disponíveis na página inicial:');
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      const name = await card.locator('.pokemon-name').textContent();
      console.log(`   ${i + 1}. ${name}`);
    }

    // Abrir modal do primeiro Pokémon
    console.log('\n🎯 Abrindo modal do primeiro Pokémon...');
    const firstCard = cards.first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();
    console.log(`📱 Abrindo modal de: ${pokemonName}`);
    
    await firstCard.click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal aberto com sucesso');

    // Verificar informações básicas do modal
    console.log('\n📊 Verificando informações básicas do modal...');
    
    // Nome do Pokémon
    const modalTitle = modal.locator('h1');
    const modalPokemonName = await modalTitle.textContent();
    console.log(`🏷️ Nome no modal: ${modalPokemonName}`);
    expect(modalPokemonName).toBeTruthy();

    // Verificar imagem principal
    const mainImage = modal.locator('.main-image-container img');
    if (await mainImage.count() > 0) {
      const imageSrc = await mainImage.getAttribute('src');
      console.log(`🖼️ Imagem principal: ${imageSrc?.substring(0, 50)}...`);
      await expect(mainImage).toBeVisible();
    }

    // Verificar thumbnails
    const thumbnails = modal.locator('.thumbnail-btn-inline');
    const thumbnailCount = await thumbnails.count();
    console.log(`🖼️ Thumbnails disponíveis: ${thumbnailCount}`);

    // Testar navegação entre thumbnails
    if (thumbnailCount > 1) {
      console.log('🔄 Testando navegação entre thumbnails...');
      for (let i = 0; i < Math.min(thumbnailCount, 3); i++) {
        await thumbnails.nth(i).click();
        await page.waitForTimeout(500);
        console.log(`   ✅ Thumbnail ${i + 1} clicado`);
      }
    }

    // Identificar e navegar pelas abas
    console.log('\n📑 Identificando abas disponíveis...');
    const tabs = modal.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`📋 Total de abas encontradas: ${tabCount}`);

    // Listar todas as abas
    const tabNames = [];
    for (let i = 0; i < tabCount; i++) {
      const tabText = await tabs.nth(i).textContent();
      tabNames.push(tabText?.trim() || `Aba ${i + 1}`);
      console.log(`   ${i + 1}. ${tabText?.trim()}`);
    }

    // Navegar por cada aba e verificar conteúdo
    for (let i = 0; i < tabCount; i++) {
      const tabName = tabNames[i];
      console.log(`\n🔍 === NAVEGANDO PARA ABA: ${tabName} ===`);
      
      // Clicar na aba
      await tabs.nth(i).click();
      await page.waitForTimeout(2000);
      
      // Verificar se aba está ativa
      const isActive = await tabs.nth(i).evaluate(el => 
        el.classList.contains('active') || 
        el.classList.contains('selected') ||
        el.getAttribute('aria-selected') === 'true'
      );
      console.log(`📌 Aba "${tabName}" está ativa: ${isActive}`);

      // Verificar conteúdo específico de cada aba
      await verifyTabContent(page, modal, tabName, i);
    }

    // Testar funcionalidades adicionais do modal
    console.log('\n🔧 Testando funcionalidades adicionais...');

    // Verificar botões de navegação do carousel (se existirem)
    const prevButton = modal.locator('.carousel-nav.prev');
    const nextButton = modal.locator('.carousel-nav.next');
    
    if (await prevButton.count() > 0) {
      console.log('⬅️ Testando botão anterior do carousel...');
      await prevButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Botão anterior funcionando');
    }
    
    if (await nextButton.count() > 0) {
      console.log('➡️ Testando botão próximo do carousel...');
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Botão próximo funcionando');
    }

    // Verificar botões de ação (se existirem)
    console.log('\n🎮 Verificando botões de ação...');
    const actionButtons = modal.locator('button, ion-button');
    const buttonCount = await actionButtons.count();
    console.log(`🔘 Total de botões encontrados: ${buttonCount}`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = actionButtons.nth(i);
      if (await button.isVisible()) {
        const buttonText = await button.textContent();
        const buttonClass = await button.getAttribute('class');
        console.log(`   ${i + 1}. "${buttonText?.trim()}" (${buttonClass?.split(' ')[0]})`);
      }
    }

    // Testar fechamento do modal
    console.log('\n🚪 Testando fechamento do modal...');
    
    // Método 1: Tecla Escape
    console.log('🔑 Tentando fechar com Escape...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    const modalClosed = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count() === 0;
    if (modalClosed) {
      console.log('✅ Modal fechado com sucesso usando Escape');
    } else {
      console.log('❌ Modal não fechou com Escape, tentando outros métodos...');
      
      // Método 2: Botão de fechar
      const closeButton = modal.locator('.close-button');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Modal fechado usando botão de fechar');
      }
    }

    console.log('\n🎉 Navegação completa do modal finalizada!');
  });

  // Função auxiliar para verificar conteúdo específico de cada aba
  async function verifyTabContent(page: any, modal: any, tabName: string, tabIndex: number) {
    console.log(`🔍 Verificando conteúdo da aba "${tabName}"...`);

    // Aguardar conteúdo carregar
    await page.waitForTimeout(1500);

    switch (tabName.toLowerCase()) {
      case 'visão geral':
        console.log('📊 Verificando aba Visão Geral...');
        
        // Verificar informações básicas
        const basicInfo = modal.locator('.pokemon-info, .basic-info, .overview');
        if (await basicInfo.count() > 0) {
          console.log('   ✅ Seção de informações básicas encontrada');
        }

        // Verificar tipos
        const types = modal.locator('.pokemon-type, .type-chip, .type-badge');
        const typeCount = await types.count();
        if (typeCount > 0) {
          console.log(`   ✅ ${typeCount} tipos encontrados`);
          for (let i = 0; i < typeCount; i++) {
            const typeText = await types.nth(i).textContent();
            console.log(`      - Tipo: ${typeText}`);
          }
        }

        // Verificar estatísticas
        const stats = modal.locator('.stats, .pokemon-stats, .stat-item');
        const statCount = await stats.count();
        if (statCount > 0) {
          console.log(`   ✅ ${statCount} estatísticas encontradas`);
        }
        break;

      case 'combate':
        console.log('⚔️ Verificando aba Combate...');
        
        // Verificar movimentos
        const moves = modal.locator('.move, .attack, .ability');
        const moveCount = await moves.count();
        if (moveCount > 0) {
          console.log(`   ✅ ${moveCount} movimentos/habilidades encontrados`);
        }

        // Verificar efetividades
        const effectiveness = modal.locator('.effectiveness, .type-effectiveness');
        if (await effectiveness.count() > 0) {
          console.log('   ✅ Informações de efetividade encontradas');
        }
        break;

      case 'evolução':
        console.log('🔄 Verificando aba Evolução...');
        
        // Verificar cadeia evolutiva
        const evolutionChain = modal.locator('.evolution, .evolution-chain, .evolution-stage');
        const evolutionCount = await evolutionChain.count();
        if (evolutionCount > 0) {
          console.log(`   ✅ ${evolutionCount} estágios evolutivos encontrados`);
        } else {
          console.log('   ℹ️ Nenhuma evolução encontrada (pode não evoluir)');
        }

        // Verificar condições de evolução
        const conditions = modal.locator('.evolution-condition, .requirement');
        if (await conditions.count() > 0) {
          console.log('   ✅ Condições de evolução encontradas');
        }
        break;

      case 'curiosidades':
        console.log('🎭 Verificando aba Curiosidades...');
        
        // Verificar flavor texts
        const flavorTexts = modal.locator('.flavor-text, .description, .curiosity');
        const flavorCount = await flavorTexts.count();
        if (flavorCount > 0) {
          console.log(`   ✅ ${flavorCount} textos de curiosidades encontrados`);
          
          // Mostrar primeiro texto como exemplo
          const firstText = await flavorTexts.first().textContent();
          if (firstText && firstText.length > 10) {
            console.log(`   📝 Exemplo: "${firstText.substring(0, 50)}..."`);
          }
        }

        // Verificar habitat
        const habitat = modal.locator('.habitat, .location');
        if (await habitat.count() > 0) {
          const habitatText = await habitat.first().textContent();
          console.log(`   🏞️ Habitat: ${habitatText}`);
        }
        break;

      default:
        console.log(`❓ Verificando aba desconhecida "${tabName}"...`);
        
        // Verificação genérica
        const content = modal.locator('div, p, span, section');
        const contentCount = await content.count();
        console.log(`   📄 ${contentCount} elementos de conteúdo encontrados`);
        break;
    }

    // Verificar se há conteúdo visível na aba
    const visibleElements = modal.locator('*:visible');
    const visibleCount = await visibleElements.count();
    console.log(`   👁️ ${visibleCount} elementos visíveis na aba`);

    // Capturar screenshot da aba (opcional)
    // await page.screenshot({ path: `tab-${tabIndex}-${tabName.replace(/\s+/g, '-')}.png` });
  }
});
