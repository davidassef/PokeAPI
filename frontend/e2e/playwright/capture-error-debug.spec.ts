import { test, expect } from '@playwright/test';

/**
 * Teste focado no erro de captura em produção
 * Baseado nos logs: CapturedService com problemas de autenticação
 */

test.describe('Debug Erro de Captura - Produção', () => {
  
  test('deve fazer login e tentar capturar pokémon com logs detalhados', async ({ page }) => {
    console.log('🧪 Iniciando teste de captura com login');
    
    // Monitorar console para erros específicos
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('CapturedService') || text.includes('capture') || text.includes('ERROR') || text.includes('❌')) {
        console.log(`🔍 [CONSOLE]: ${text}`);
      }
    });

    // Monitorar requests de captura
    page.on('request', request => {
      if (request.url().includes('capture') || request.url().includes('pokemon') && request.method() === 'POST') {
        console.log(`📡 [CAPTURE REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('capture') || (response.url().includes('pokemon') && response.request().method() === 'POST')) {
        console.log(`📡 [CAPTURE RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    // Navegar para produção
    await page.goto('https://poke-api-mauve.vercel.app');
    await page.waitForLoadState('networkidle');
    console.log('✅ Página carregada');

    // Fazer login
    console.log('🔐 Fazendo login...');
    const loginButton = page.locator('ion-button:has-text("Entrar")');
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    
    await page.fill('input[type="email"]', 'teste@teste.com');
    await page.fill('input[type="password"]', 'Teste123');
    await page.click('ion-button[type="submit"]');
    
    // Aguardar login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Login realizado');

    // Verificar se está logado
    const userAvatar = page.locator('ion-avatar, .user-info, .profile-info');
    if (await userAvatar.isVisible()) {
      console.log('✅ Usuário logado confirmado');
    } else {
      console.log('⚠️ Status de login incerto');
    }

    // Aguardar pokémons carregarem
    await page.waitForSelector('.pokemon-card, .pokemon-item', { timeout: 10000 });
    console.log('✅ Pokémons carregados');

    // Clicar no primeiro pokémon
    const firstPokemon = page.locator('.pokemon-card, .pokemon-item').first();
    const pokemonName = await firstPokemon.locator('h3, h4, .pokemon-name').textContent();
    console.log(`🎯 Clicando em: ${pokemonName}`);
    
    await firstPokemon.click();
    await page.waitForTimeout(2000);

    // Procurar botão de captura
    const captureSelectors = [
      'ion-button:has-text("Capturar")',
      'button:has-text("Capturar")',
      '.capture-btn',
      '.btn-capture',
      '[data-action="capture"]',
      'ion-button[color="success"]'
    ];

    let captureButton = null;
    for (const selector of captureSelectors) {
      const btn = page.locator(selector);
      if (await btn.isVisible()) {
        captureButton = btn;
        console.log(`✅ Botão de captura encontrado: ${selector}`);
        break;
      }
    }

    if (!captureButton) {
      console.log('❌ Botão de captura não encontrado');
      
      // Listar todos os botões visíveis
      const allButtons = page.locator('button, ion-button');
      const buttonCount = await allButtons.count();
      console.log(`📊 Botões disponíveis: ${buttonCount}`);
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        const isVisible = await allButtons.nth(i).isVisible();
        console.log(`  - Botão ${i}: "${buttonText}" (visível: ${isVisible})`);
      }
      return;
    }

    // Tentar capturar
    console.log('🎯 Tentando capturar pokémon...');
    
    // Capturar logs antes da captura
    const logsBefore = consoleMessages.length;
    
    await captureButton.click();
    console.log('✅ Botão de captura clicado');
    
    // Aguardar resposta
    await page.waitForTimeout(5000);
    
    // Verificar novos logs
    const logsAfter = consoleMessages.length;
    if (logsAfter > logsBefore) {
      console.log(`📊 Novos logs capturados: ${logsAfter - logsBefore}`);
      const newLogs = consoleMessages.slice(logsBefore);
      newLogs.forEach(log => {
        if (log.includes('ERROR') || log.includes('❌') || log.includes('capture')) {
          console.log(`🔍 [NOVO LOG]: ${log}`);
        }
      });
    }

    // Verificar mensagens de feedback
    const successSelectors = [
      '.success-message',
      '.toast-success', 
      'ion-toast',
      '.alert-success'
    ];

    const errorSelectors = [
      '.error-message',
      '.toast-error',
      '.alert-error',
      'ion-alert'
    ];

    let hasSuccess = false;
    let hasError = false;

    for (const selector of successSelectors) {
      if (await page.locator(selector).isVisible()) {
        const text = await page.locator(selector).textContent();
        console.log(`✅ Sucesso: ${text}`);
        hasSuccess = true;
        break;
      }
    }

    for (const selector of errorSelectors) {
      if (await page.locator(selector).isVisible()) {
        const text = await page.locator(selector).textContent();
        console.log(`❌ Erro: ${text}`);
        hasError = true;
        break;
      }
    }

    if (!hasSuccess && !hasError) {
      console.log('⚠️ Nenhuma mensagem de feedback visível');
    }

    // Verificar se houve requests de captura
    console.log('🔍 Análise concluída - verifique os logs acima');
  });

});
