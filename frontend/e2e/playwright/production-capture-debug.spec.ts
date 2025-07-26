import { test, expect } from '@playwright/test';

/**
 * Teste específico para debugar erro de captura em produção
 * Monitora console e network para identificar problemas
 */

test.describe('Produção - Debug Captura Pokémon', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar monitoramento de console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🔍 [CONSOLE ${type.toUpperCase()}]: ${text}`);
    });

    // Configurar monitoramento de network
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('capture')) {
        console.log(`📡 [REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('capture')) {
        console.log(`📡 [RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    // Configurar monitoramento de erros
    page.on('pageerror', error => {
      console.log(`❌ [PAGE ERROR]: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`❌ [REQUEST FAILED]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('deve fazer login e tentar capturar pokémon em produção', async ({ page }) => {
    console.log('🧪 Iniciando teste de captura em produção');
    
    // Navegar para produção
    await page.goto('https://poke-api-mauve.vercel.app');
    console.log('✅ Navegou para produção');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    console.log('✅ Página carregada');
    
    // Fazer login
    console.log('🔐 Iniciando login...');
    const loginButton = page.locator('ion-button:has-text("Entrar")');
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    
    // Preencher credenciais
    await page.fill('input[type="email"]', 'teste@teste.com');
    await page.fill('input[type="password"]', 'Teste123');
    
    // Submeter login
    const submitButton = page.locator('ion-button[type="submit"]');
    await submitButton.click();
    console.log('✅ Login submetido');
    
    // Aguardar redirecionamento
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Login realizado');
    
    // Verificar se está logado
    const userInfo = page.locator('.user-info, .profile-info, ion-avatar');
    if (await userInfo.isVisible()) {
      console.log('✅ Usuário logado confirmado');
    }
    
    // Encontrar um pokémon para capturar
    console.log('🔍 Procurando pokémon para capturar...');
    const pokemonCards = page.locator('.pokemon-card, .pokemon-item');
    await pokemonCards.first().waitFor({ state: 'visible', timeout: 10000 });
    
    const pokemonCount = await pokemonCards.count();
    console.log(`📊 Encontrados ${pokemonCount} pokémons`);
    
    // Clicar no primeiro pokémon
    const firstPokemon = pokemonCards.first();
    const pokemonName = await firstPokemon.locator('.pokemon-name, h3, h4').textContent();
    console.log(`🎯 Tentando capturar: ${pokemonName}`);
    
    await firstPokemon.click();
    console.log('✅ Pokémon clicado');
    
    // Aguardar modal abrir
    await page.waitForTimeout(2000);
    
    // Procurar botão de captura
    const captureButtons = [
      'ion-button:has-text("Capturar")',
      'button:has-text("Capturar")',
      '.capture-btn',
      '.btn-capture',
      '[data-action="capture"]'
    ];
    
    let captureButton = null;
    for (const selector of captureButtons) {
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
        console.log(`  - Botão ${i}: "${buttonText}"`);
      }
      return;
    }
    
    // Tentar capturar
    console.log('🎯 Tentando capturar pokémon...');
    await captureButton.click();
    console.log('✅ Botão de captura clicado');
    
    // Aguardar resposta
    await page.waitForTimeout(5000);
    
    // Verificar se houve sucesso ou erro
    const successMessage = page.locator('.success-message, .toast-success, ion-toast');
    const errorMessage = page.locator('.error-message, .toast-error, .alert-error');
    
    if (await successMessage.isVisible()) {
      const successText = await successMessage.textContent();
      console.log(`✅ Captura bem-sucedida: ${successText}`);
    } else if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Erro na captura: ${errorText}`);
    } else {
      console.log('⚠️ Nenhuma mensagem de feedback visível');
    }
    
    // Capturar estado final da página
    const finalUrl = page.url();
    console.log(`📍 URL final: ${finalUrl}`);
    
    // Verificar se há erros no console
    console.log('🔍 Teste concluído - verifique os logs acima para erros');
  });

  test('deve verificar conectividade com backend em produção', async ({ page }) => {
    console.log('🧪 Testando conectividade com backend');
    
    // Testar endpoint de health
    const healthResponse = await page.request.get('https://pokeapi-la6k.onrender.com/health');
    console.log(`📡 Health check: ${healthResponse.status()}`);
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      console.log(`✅ Backend online: ${JSON.stringify(healthData)}`);
    } else {
      console.log(`❌ Backend offline: ${healthResponse.status()}`);
    }
    
    // Navegar para a aplicação
    await page.goto('https://poke-api-mauve.vercel.app');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há erros de CORS ou conectividade
    await page.waitForTimeout(3000);
    console.log('✅ Verificação de conectividade concluída');
  });

  test('deve monitorar requests de captura específicos', async ({ page }) => {
    console.log('🧪 Monitorando requests de captura');
    
    // Interceptar requests específicos
    await page.route('**/api/**', route => {
      const request = route.request();
      console.log(`🔍 [INTERCEPTED]: ${request.method()} ${request.url()}`);
      console.log(`🔍 [HEADERS]: ${JSON.stringify(request.headers())}`);
      
      if (request.postData()) {
        console.log(`🔍 [BODY]: ${request.postData()}`);
      }
      
      route.continue();
    });
    
    // Fazer login e tentar captura
    await page.goto('https://poke-api-mauve.vercel.app');
    await page.waitForLoadState('networkidle');
    
    // Login rápido
    const loginButton = page.locator('ion-button:has-text("Entrar")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'teste@teste.com');
      await page.fill('input[type="password"]', 'Teste123');
      await page.click('ion-button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Monitoramento de requests configurado');
  });

});
