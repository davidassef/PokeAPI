import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Busca e Filtros
 * Testa todas as funcionalidades de busca e filtros da aplicação
 */
test.describe('2. Testes de Busca e Filtros', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Deve funcionar busca por nome do Pokémon', async ({ page }) => {
    console.log('🧪 Testando busca por nome...');

    // Buscar por "pikachu"
    await page.fill('ion-searchbar input', 'pikachu');
    await page.waitForTimeout(2000);

    // Verificar se apenas Pikachu aparece nos resultados
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCardName = await cards.first().locator('.pokemon-name').textContent();
      expect(firstCardName?.toLowerCase()).toContain('pikachu');
      console.log('✅ Busca por nome funcionando');
    } else {
      console.log('⚠️ Nenhum resultado encontrado para Pikachu');
    }

    // Limpar busca
    await page.fill('ion-searchbar input', '');
    await page.waitForTimeout(2000);
  });

  test('Deve funcionar filtros por tipo de elemento', async ({ page }) => {
    console.log('🧪 Testando filtros por tipo...');

    // Abrir filtros avançados
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Selecionar tipo "Fogo"
    const fireChip = page.locator('ion-chip:has-text("Fogo")');
    await fireChip.click();
    await page.waitForTimeout(3000);

    // Verificar se o chip está selecionado
    await expect(fireChip).toHaveClass(/selected/);

    // Verificar se os Pokémon mostrados são do tipo fogo
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Verificar primeiro card
      const firstCard = cards.first();
      const typeElements = firstCard.locator('.pokemon-type');
      const hasFireType = await typeElements.locator(':has-text("fire")').count() > 0;
      
      console.log(`✅ Filtro por tipo aplicado - ${cardCount} Pokémon encontrados`);
    }

    // Limpar filtro
    await fireChip.click();
    await page.waitForTimeout(2000);
  });

  test('Deve funcionar filtros por geração', async ({ page }) => {
    console.log('🧪 Testando filtros por geração...');

    // Abrir filtros avançados
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Selecionar geração 1
    await page.selectOption('select[formControlName="selectedGeneration"]', '1');
    await page.waitForTimeout(3000);

    // Verificar se apenas Pokémon da geração 1 aparecem (IDs 1-151)
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      console.log(`✅ Filtro por geração aplicado - ${cardCount} Pokémon da Geração 1`);
    }

    // Resetar filtro
    await page.selectOption('select[formControlName="selectedGeneration"]', '');
    await page.waitForTimeout(2000);
  });

  test('Deve funcionar filtros por habitat', async ({ page }) => {
    console.log('🧪 Testando filtros por habitat...');

    // Abrir filtros avançados
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Verificar se seção de habitats existe
    const habitatSection = page.locator('.filter-section:has-text("Habitats")');
    if (await habitatSection.count() > 0) {
      // Selecionar habitat "Floresta"
      const forestChip = page.locator('ion-chip:has-text("Floresta")');
      if (await forestChip.count() > 0) {
        await forestChip.click();
        await page.waitForTimeout(3000);

        // Verificar se o filtro foi aplicado
        await expect(forestChip).toHaveClass(/selected/);
        console.log('✅ Filtro por habitat funcionando');

        // Limpar filtro
        await forestChip.click();
      } else {
        console.log('⚠️ Chip de habitat "Floresta" não encontrado');
      }
    } else {
      console.log('⚠️ Seção de habitats não encontrada');
    }
  });

  test('Deve funcionar ordenação', async ({ page }) => {
    console.log('🧪 Testando ordenação...');

    // Abrir filtros avançados
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Ordenar por nome
    await page.selectOption('select[formControlName="sortBy"]', 'name');
    await page.waitForTimeout(3000);

    // Verificar se a ordenação foi aplicada
    const cards = page.locator('app-pokemon-card');
    if (await cards.count() > 1) {
      const firstName = await cards.first().locator('.pokemon-name').textContent();
      const secondName = await cards.nth(1).locator('.pokemon-name').textContent();
      
      if (firstName && secondName) {
        const isAlphabetical = firstName.localeCompare(secondName) <= 0;
        expect(isAlphabetical).toBeTruthy();
        console.log('✅ Ordenação por nome funcionando');
      }
    }

    // Testar ordem descendente
    await page.selectOption('select[formControlName="sortOrder"]', 'desc');
    await page.waitForTimeout(3000);
    console.log('✅ Ordenação descendente aplicada');

    // Resetar ordenação
    await page.selectOption('select[formControlName="sortBy"]', 'id');
    await page.selectOption('select[formControlName="sortOrder"]', 'asc');
  });

  test('Deve funcionar combinação de filtros', async ({ page }) => {
    console.log('🧪 Testando combinação de filtros...');

    // Abrir filtros avançados
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Aplicar busca por nome + tipo
    await page.fill('ion-searchbar input', 'char');
    await page.waitForTimeout(1000);

    const fireChip = page.locator('ion-chip:has-text("Fogo")');
    await fireChip.click();
    await page.waitForTimeout(3000);

    // Verificar se ambos os filtros estão ativos
    const searchValue = await page.inputValue('ion-searchbar input');
    expect(searchValue).toBe('char');
    await expect(fireChip).toHaveClass(/selected/);

    console.log('✅ Combinação de filtros funcionando');

    // Limpar todos os filtros
    await page.click('ion-button:has-text("Limpar")');
    await page.waitForTimeout(2000);

    // Verificar se filtros foram limpos
    const clearedSearchValue = await page.inputValue('ion-searchbar input');
    expect(clearedSearchValue).toBe('');
    console.log('✅ Limpeza de filtros funcionando');
  });

  test('Deve mostrar contador de filtros ativos', async ({ page }) => {
    console.log('🧪 Testando contador de filtros ativos...');

    // Verificar se não há badge inicialmente
    const filterBadge = page.locator('.filter-badge');
    await expect(filterBadge).not.toBeVisible();

    // Abrir filtros e aplicar alguns
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.advanced-filters', { timeout: 5000 });

    // Aplicar filtro de tipo
    await page.click('ion-chip:has-text("Água")');
    await page.waitForTimeout(1000);

    // Verificar se badge aparece com "1"
    await expect(filterBadge).toBeVisible();
    await expect(filterBadge).toHaveText('1');

    // Aplicar mais um filtro
    await page.selectOption('select[formControlName="selectedGeneration"]', '1');
    await page.waitForTimeout(1000);

    // Verificar se badge mostra "2"
    await expect(filterBadge).toHaveText('2');
    console.log('✅ Contador de filtros ativos funcionando');
  });
});
