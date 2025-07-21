#!/usr/bin/env node

/**
 * Script para Executar Suíte Completa de Testes E2E
 * PokeAPI Sync - Validação Abrangente de Funcionalidades
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Suíte Completa de Testes E2E - PokeAPI Sync');
console.log('=' .repeat(60));

// Configurações
const testConfig = {
  configFile: './e2e/comprehensive-tests/comprehensive-test-suite.config.ts',
  outputDir: './test-results',
  headed: true, // Executar com interface visual
  workers: 1,   // Executar sequencialmente para melhor controle
};

// Criar diretório de resultados se não existir
if (!fs.existsSync(testConfig.outputDir)) {
  fs.mkdirSync(testConfig.outputDir, { recursive: true });
}

// Função para executar comando e capturar saída
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`🔧 Comando: ${command}`);
  console.log('-'.repeat(50));
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} - Concluído`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Falhou`);
    console.error(`Erro: ${error.message}`);
    return false;
  }
}

// Função principal
async function runComprehensiveTests() {
  const startTime = Date.now();
  
  console.log('📊 Configurações dos Testes:');
  console.log(`   • Modo: ${testConfig.headed ? 'Headed (Visual)' : 'Headless'}`);
  console.log(`   • Workers: ${testConfig.workers}`);
  console.log(`   • Config: ${testConfig.configFile}`);
  console.log(`   • Resultados: ${testConfig.outputDir}`);
  
  // Verificar se o servidor está rodando
  console.log('\n🔍 Verificando servidor de desenvolvimento...');
  try {
    const { execSync } = require('child_process');
    execSync('curl -f http://localhost:8100 > /dev/null 2>&1', { stdio: 'ignore' });
    console.log('✅ Servidor rodando em http://localhost:8100');
  } catch (error) {
    console.log('⚠️  Servidor não detectado. Certifique-se de que está rodando em http://localhost:8100');
    console.log('   Execute: npm start');
    process.exit(1);
  }

  // Executar testes por categoria
  const testSuites = [
    {
      name: '1. Navegação',
      file: '01-navigation.spec.ts',
      description: 'Testa navegação entre páginas e manutenção de estado'
    },
    {
      name: '2. Busca e Filtros',
      file: '02-search-filters.spec.ts',
      description: 'Testa sistema de busca, filtros e ordenação'
    },
    {
      name: '3. Modal de Detalhes',
      file: '03-pokemon-modal.spec.ts',
      description: 'Testa modal de detalhes e todas as suas abas'
    },
    {
      name: '4. Favoritos e Captura',
      file: '04-favorites-capture.spec.ts',
      description: 'Testa sistemas de favoritos e captura de Pokémon'
    },
    {
      name: '5. Responsividade',
      file: '05-responsiveness.spec.ts',
      description: 'Testa adaptação a diferentes tamanhos de tela'
    },
    {
      name: '6. Performance',
      file: '06-performance.spec.ts',
      description: 'Testa tempos de carregamento e responsividade'
    },
    {
      name: '7. Integração',
      file: '07-integration.spec.ts',
      description: 'Testa comunicação com APIs e persistência'
    },
    {
      name: '8. Acessibilidade',
      file: '08-accessibility.spec.ts',
      description: 'Testa recursos de acessibilidade e usabilidade'
    }
  ];

  const results = {
    total: testSuites.length,
    passed: 0,
    failed: 0,
    details: []
  };

  // Executar cada suíte de testes
  for (const suite of testSuites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 EXECUTANDO: ${suite.name}`);
    console.log(`📝 ${suite.description}`);
    console.log(`📁 Arquivo: ${suite.file}`);
    console.log(`${'='.repeat(60)}`);

    const command = `npx playwright test ${suite.file} ` +
                   `--config=${testConfig.configFile} ` +
                   `${testConfig.headed ? '--headed' : ''} ` +
                   `--workers=${testConfig.workers} ` +
                   `--reporter=list`;

    const success = runCommand(command, `Suíte ${suite.name}`);
    
    if (success) {
      results.passed++;
      results.details.push({ suite: suite.name, status: 'PASSOU', file: suite.file });
    } else {
      results.failed++;
      results.details.push({ suite: suite.name, status: 'FALHOU', file: suite.file });
    }

    // Pausa entre suítes para estabilidade
    console.log('\n⏳ Aguardando 3 segundos antes da próxima suíte...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Gerar relatório final
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DA SUÍTE COMPLETA DE TESTES');
  console.log('='.repeat(60));
  console.log(`⏱️  Tempo total: ${duration} segundos`);
  console.log(`📈 Total de suítes: ${results.total}`);
  console.log(`✅ Suítes aprovadas: ${results.passed}`);
  console.log(`❌ Suítes falharam: ${results.failed}`);
  console.log(`📊 Taxa de sucesso: ${Math.round((results.passed / results.total) * 100)}%`);

  console.log('\n📋 Detalhes por Suíte:');
  results.details.forEach((detail, index) => {
    const status = detail.status === 'PASSOU' ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${detail.suite} (${detail.file})`);
  });

  // Informações sobre relatórios
  console.log('\n📁 Relatórios Gerados:');
  console.log(`   • HTML: ${testConfig.outputDir}/comprehensive-report/index.html`);
  console.log(`   • JSON: ${testConfig.outputDir}/comprehensive-results.json`);
  console.log(`   • JUnit: ${testConfig.outputDir}/comprehensive-junit.xml`);

  if (results.failed > 0) {
    console.log('\n⚠️  ATENÇÃO: Algumas suítes falharam. Verifique os relatórios para detalhes.');
    console.log('   Screenshots e vídeos das falhas estão disponíveis no diretório test-results/');
  } else {
    console.log('\n🎉 PARABÉNS! Todas as suítes de teste passaram com sucesso!');
    console.log('   A aplicação PokeAPI Sync está funcionando perfeitamente.');
  }

  console.log('\n' + '='.repeat(60));
  
  return results.failed === 0;
}

// Executar se chamado diretamente
if (require.main === module) {
  runComprehensiveTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal na execução dos testes:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests };
