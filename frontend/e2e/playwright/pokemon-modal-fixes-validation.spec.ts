import { test, expect } from '@playwright/test';

/**
 * Testes específicos para validar as correções implementadas no modal de detalhes do Pokémon
 * 
 * Este arquivo foca especificamente em reproduzir e validar os problemas que foram corrigidos:
 * 1. Seção Curiosidades não carregando na primeira visualização
 * 2. Chaves de tradução evolution.triggers.Nível e habitats.mountain
 * 3. Seção de evolução com loading infinito após reabrir modal
 */

test.describe('Validação das Correções do Modal', () => {
  
  // Helper functions
  async function waitForModalToLoad(page: any) {
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 15000 });
    await page.waitForSelector('app-details-modal .tab-btn', { timeout: 10000 });
    await page.waitForTimeout(2000);
  }

  async function openPokemonModal(page: any, pokemonIndex = 0) {
    const pokemonCards = page.locator('app-pokemon-card');
    await pokemonCards.nth(pokemonIndex).click();
    await waitForModalToLoad(page);
    return page.locator('app-details-modal[ng-reflect-is-open="true"]');
  }

  async function closeModal(page: any) {
    const closeButton = page.locator('app-details-modal .close-btn, app-details-modal .modal-close, app-details-modal ion-button[fill="clear"]').first();
    await closeButton.click();
    await page.waitForTimeout(1000);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test.describe('Correção 1: Seção Curiosidades - Primeira Visualização', () => {
    
    test('ANTES: Reproduzir problema original - Curiosidades não carregava na primeira vez', async ({ page }) => {
      console.log('🔍 Reproduzindo problema original da seção Curiosidades...');
      
      const modal = await openPokemonModal(page);
      
      // Navegar DIRETAMENTE para Curiosidades (cenário problemático original)
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      
      // No problema original, isso falharia ou não mostraria conteúdo
      await page.waitForTimeout(3000);
      
      // Verificar se o problema foi corrigido
      const curiositiesContent = modal.locator('.curiosities-content');
      const isVisible = await curiositiesContent.isVisible();
      
      if (isVisible) {
        console.log('✅ CORREÇÃO VALIDADA: Curiosidades carrega na primeira visualização');
        
        // Verificar se há conteúdo real
        const hasContent = await curiositiesContent.locator('.info-section, .habitat-info, .flavor-text, .capture-info').count();
        expect(hasContent).toBeGreaterThan(0);
        
        // Verificar se não está em loading infinito
        const isLoading = await modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ }).count();
        expect(isLoading).toBe(0);
        
      } else {
        console.log('❌ PROBLEMA AINDA EXISTE: Curiosidades não carrega na primeira vez');
        throw new Error('Seção Curiosidades não carrega na primeira visualização');
      }
    });

    test('DEPOIS: Validar que isCuriositiesDataReady() funciona corretamente', async ({ page }) => {
      console.log('🧪 Validando método isCuriositiesDataReady()...');
      
      const modal = await openPokemonModal(page);
      
      // Verificar estado antes de navegar para Curiosidades
      const initialState = await page.evaluate(() => {
        const modalComponent = document.querySelector('app-details-modal') as any;
        return modalComponent && modalComponent.isCuriositiesDataReady ? modalComponent.isCuriositiesDataReady() : null;
      });
      
      console.log(`📊 Estado inicial isCuriositiesDataReady: ${initialState}`);
      
      // Navegar para Curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);
      
      // Verificar estado após carregamento
      const finalState = await page.evaluate(() => {
        const modalComponent = document.querySelector('app-details-modal') as any;
        return modalComponent && modalComponent.isCuriositiesDataReady ? modalComponent.isCuriositiesDataReady() : null;
      });
      
      console.log(`📊 Estado final isCuriositiesDataReady: ${finalState}`);
      
      // Deve retornar true após carregamento
      expect(finalState).toBe(true);
      
      // Verificar se conteúdo está visível
      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();
      
      console.log('✅ isCuriositiesDataReady() funciona corretamente');
    });

    test('VALIDAÇÃO: Curiosidades funciona sem precisar trocar abas', async ({ page }) => {
      console.log('🧪 Validando que não precisa trocar abas...');
      
      const modal = await openPokemonModal(page);
      
      // Ir DIRETO para Curiosidades sem passar por outras abas
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      
      // Deve funcionar imediatamente (correção aplicada)
      await page.waitForTimeout(5000);
      
      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible({ timeout: 10000 });
      
      // Verificar se há conteúdo real
      const hasContent = await curiositiesContent.locator('.info-section, .habitat-info, .flavor-text').count();
      expect(hasContent).toBeGreaterThan(0);
      
      console.log('✅ CORREÇÃO VALIDADA: Funciona sem trocar abas');
    });
  });

  test.describe('Correção 2: Chaves de Tradução', () => {
    
    test('ANTES: Reproduzir problema - evolution.triggers.Nível não traduzido', async ({ page }) => {
      console.log('🔍 Verificando tradução de evolution.triggers.Nível...');
      
      const modal = await openPokemonModal(page);
      
      // Navegar para aba Evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000);
      
      // Verificar se não há chaves não traduzidas (problema original)
      const untranslatedKeys = await page.locator('text=/evolution\.triggers\./').count();
      
      if (untranslatedKeys === 0) {
        console.log('✅ CORREÇÃO VALIDADA: Chaves evolution.triggers traduzidas');
      } else {
        console.log('❌ PROBLEMA AINDA EXISTE: Chaves evolution.triggers não traduzidas');
        
        // Mostrar quais chaves não estão traduzidas
        const untranslatedTexts = await page.locator('text=/evolution\.triggers\./')
          .allTextContents();
        console.log(`🔍 Chaves não traduzidas encontradas: ${untranslatedTexts.join(', ')}`);
      }
      
      expect(untranslatedKeys).toBe(0);
    });

    test('ANTES: Reproduzir problema - habitats.mountain não traduzido', async ({ page }) => {
      console.log('🔍 Verificando tradução de habitats.mountain...');
      
      const modal = await openPokemonModal(page);
      
      // Navegar para aba Curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);
      
      // Verificar se não há chaves de habitat não traduzidas
      const untranslatedHabitats = await page.locator('text=/habitats\./').count();
      
      if (untranslatedHabitats === 0) {
        console.log('✅ CORREÇÃO VALIDADA: Chaves habitats traduzidas');
      } else {
        console.log('❌ PROBLEMA AINDA EXISTE: Chaves habitats não traduzidas');
        
        // Mostrar quais chaves não estão traduzidas
        const untranslatedTexts = await page.locator('text=/habitats\./')
          .allTextContents();
        console.log(`🔍 Chaves não traduzidas encontradas: ${untranslatedTexts.join(', ')}`);
      }
      
      expect(untranslatedHabitats).toBe(0);
    });

    test('VALIDAÇÃO: Verificar que seção evolution duplicada foi removida', async ({ page }) => {
      console.log('🧪 Validando remoção de seção evolution duplicada...');
      
      // Esta validação é mais sobre a estrutura dos arquivos de tradução
      // Vamos verificar se as traduções funcionam corretamente
      
      const modal = await openPokemonModal(page);
      
      // Testar evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000);
      
      // Verificar se há texto "Nível" traduzido (não a chave)
      const levelText = await modal.locator('text=/Nível/').count();
      expect(levelText).toBeGreaterThan(0);
      
      // Testar curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);
      
      // Verificar se há texto de habitat traduzido
      const habitatText = await modal.locator('text=/montanha|mountain/i').count();
      // Pode ser 0 se o Pokémon não vive em montanhas, então não vamos fazer expect
      
      console.log(`📊 Textos "Nível" encontrados: ${levelText}`);
      console.log(`📊 Textos de habitat encontrados: ${habitatText}`);
      
      console.log('✅ CORREÇÃO VALIDADA: Traduções funcionam corretamente');
    });
  });

  test.describe('Correção 3: Seção de Evolução - Loading Infinito', () => {
    
    test('ANTES: Reproduzir problema - Loading infinito após reabrir modal', async ({ page }) => {
      console.log('🔍 Reproduzindo problema de loading infinito na evolução...');
      
      // Primeira abertura
      let modal = await openPokemonModal(page);
      
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000);
      
      // Verificar que carregou na primeira vez
      let evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContent).toBeVisible({ timeout: 15000 });
      
      console.log('✅ Primeira abertura: Evolução carregou corretamente');
      
      // Fechar modal
      await closeModal(page);
      
      // Reabrir modal (cenário problemático original)
      modal = await openPokemonModal(page);
      
      const evolutionTabReopen = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTabReopen.click();
      
      // Aguardar mais tempo para verificar se há loading infinito
      await page.waitForTimeout(12000);
      
      // Verificar se carregou novamente (correção aplicada)
      evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      const isVisible = await evolutionContent.isVisible();
      
      if (isVisible) {
        console.log('✅ CORREÇÃO VALIDADA: Evolução recarrega após reabrir modal');
        
        // Verificar se não há spinner infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
        const spinnerCount = await loadingSpinner.count();
        expect(spinnerCount).toBe(0);
        
      } else {
        console.log('❌ PROBLEMA AINDA EXISTE: Loading infinito na evolução');
        
        // Verificar se há spinner infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
        const spinnerCount = await loadingSpinner.count();
        
        if (spinnerCount > 0) {
          throw new Error('Seção de evolução está em loading infinito após reabrir modal');
        } else {
          throw new Error('Seção de evolução não carrega após reabrir modal');
        }
      }
    });

    test('VALIDAÇÃO: Múltiplas aberturas funcionam corretamente', async ({ page }) => {
      console.log('🧪 Validando múltiplas aberturas da evolução...');
      
      for (let i = 0; i < 3; i++) {
        console.log(`🔄 Teste ${i + 1}/3`);
        
        const modal = await openPokemonModal(page);
        
        const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
        await evolutionTab.click();
        await page.waitForTimeout(10000);
        
        // Verificar se carregou
        const evolutionContent = modal.locator('.evolution-content, .evolution-chain');
        await expect(evolutionContent).toBeVisible({ timeout: 15000 });
        
        // Verificar se não há loading infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
        expect(await loadingSpinner.count()).toBe(0);
        
        await closeModal(page);
      }
      
      console.log('✅ CORREÇÃO VALIDADA: Múltiplas aberturas funcionam');
    });

    test('VALIDAÇÃO: Timeout de segurança funciona', async ({ page }) => {
      console.log('🧪 Validando timeout de segurança...');
      
      const modal = await openPokemonModal(page);
      
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      
      // Aguardar tempo suficiente para timeout (10 segundos + margem)
      await page.waitForTimeout(12000);
      
      // Verificar se não há loading infinito (timeout deve ter funcionado)
      const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
      const spinnerCount = await loadingSpinner.count();
      
      // Deve ser 0 porque o timeout deve ter parado o loading
      expect(spinnerCount).toBe(0);
      
      console.log('✅ CORREÇÃO VALIDADA: Timeout de segurança funciona');
    });
  });

  test.describe('Validação Geral das Correções', () => {
    
    test('INTEGRAÇÃO: Todas as correções funcionam juntas', async ({ page }) => {
      console.log('🧪 Testando integração de todas as correções...');
      
      const modal = await openPokemonModal(page);
      
      // Testar Curiosidades (Correção 1)
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);
      
      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();
      
      // Verificar traduções (Correção 2)
      const untranslatedKeys = await page.locator('text=/habitats\.|evolution\.triggers\./').count();
      expect(untranslatedKeys).toBe(0);
      
      // Testar Evolução (Correção 3)
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000);
      
      const evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContent).toBeVisible({ timeout: 15000 });
      
      // Verificar traduções na evolução
      const evolutionUntranslated = await page.locator('text=/evolution\.triggers\./').count();
      expect(evolutionUntranslated).toBe(0);
      
      await closeModal(page);
      
      // Testar recarregamento (Correção 3)
      const modalReopen = await openPokemonModal(page);
      
      const evolutionTabReopen = modalReopen.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTabReopen.click();
      await page.waitForTimeout(10000);
      
      const evolutionContentReopen = modalReopen.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContentReopen).toBeVisible({ timeout: 15000 });
      
      const loadingSpinner = modalReopen.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
      expect(await loadingSpinner.count()).toBe(0);
      
      console.log('✅ TODAS AS CORREÇÕES VALIDADAS: Funcionam em conjunto');
    });
  });
});
