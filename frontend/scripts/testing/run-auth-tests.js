#!/usr/bin/env node

/**
 * Script para executar todos os testes de autenticação
 * Inclui testes unitários, de integração e E2E
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AuthTestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkPrerequisites() {
    this.log('🔍 Verificando pré-requisitos...', 'info');

    // Verificar se o Angular CLI está instalado
    try {
      execSync('ng version', { stdio: 'pipe' });
      this.log('✅ Angular CLI encontrado', 'success');
    } catch (error) {
      this.log('❌ Angular CLI não encontrado. Instale com: npm install -g @angular/cli', 'error');
      process.exit(1);
    }

    // Verificar se as dependências estão instaladas
    if (!fs.existsSync('node_modules')) {
      this.log('❌ Dependências não encontradas. Execute: npm install', 'error');
      process.exit(1);
    }

    // Verificar se o backend está rodando
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        this.log('✅ Backend está rodando na porta 8000', 'success');
      } else {
        this.log('⚠️  Backend não está respondendo corretamente', 'warning');
      }
    } catch (error) {
      this.log('⚠️  Backend não está rodando na porta 8000', 'warning');
      this.log('   Para testes E2E, inicie o backend primeiro', 'warning');
    }

    this.log('✅ Pré-requisitos verificados', 'success');
  }

  async runUnitTests() {
    this.log('🧪 Executando testes unitários de autenticação...', 'info');

    try {
      const result = execSync(
        'ng test --watch=false --browsers=ChromeHeadless --include="**/auth*.spec.ts"',
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Parsear resultados
      const passedMatch = result.match(/(\d+) passed/);
      const failedMatch = result.match(/(\d+) failed/);
      
      this.results.unit.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      this.results.unit.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      this.results.unit.total = this.results.unit.passed + this.results.unit.failed;

      if (this.results.unit.failed === 0) {
        this.log(`✅ Testes unitários: ${this.results.unit.passed} passaram`, 'success');
      } else {
        this.log(`❌ Testes unitários: ${this.results.unit.failed} falharam`, 'error');
      }

      return this.results.unit.failed === 0;
    } catch (error) {
      this.log('❌ Erro ao executar testes unitários', 'error');
      this.log(error.message, 'error');
      return false;
    }
  }

  async runIntegrationTests() {
    this.log('🔗 Executando testes de integração...', 'info');

    try {
      // Executar testes de integração específicos
      const result = execSync(
        'ng test --watch=false --browsers=ChromeHeadless --include="**/auth-integration*.spec.ts"',
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Parsear resultados (similar aos testes unitários)
      const passedMatch = result.match(/(\d+) passed/);
      const failedMatch = result.match(/(\d+) failed/);
      
      this.results.integration.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      this.results.integration.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      this.results.integration.total = this.results.integration.passed + this.results.integration.failed;

      if (this.results.integration.failed === 0) {
        this.log(`✅ Testes de integração: ${this.results.integration.passed} passaram`, 'success');
      } else {
        this.log(`❌ Testes de integração: ${this.results.integration.failed} falharam`, 'error');
      }

      return this.results.integration.failed === 0;
    } catch (error) {
      this.log('❌ Erro ao executar testes de integração', 'error');
      this.log(error.message, 'error');
      return false;
    }
  }

  async runE2ETests() {
    this.log('🌐 Executando testes E2E de autenticação...', 'info');

    try {
      // Verificar se o servidor de desenvolvimento está rodando
      let devServerRunning = false;
      try {
        const response = await fetch('http://localhost:8100');
        devServerRunning = response.ok;
      } catch (error) {
        // Servidor não está rodando
      }

      if (!devServerRunning) {
        this.log('🚀 Iniciando servidor de desenvolvimento...', 'info');
        const devServer = spawn('ng', ['serve', '--port=8100'], {
          detached: true,
          stdio: 'pipe'
        });

        // Aguardar o servidor iniciar
        await this.waitForServer('http://localhost:8100', 60000);
        this.log('✅ Servidor de desenvolvimento iniciado', 'success');
      }

      // Executar testes E2E
      const result = execSync(
        'ng e2e --spec="**/auth-flow.e2e-spec.ts"',
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Parsear resultados
      const passedMatch = result.match(/(\d+) passed/);
      const failedMatch = result.match(/(\d+) failed/);
      
      this.results.e2e.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      this.results.e2e.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      this.results.e2e.total = this.results.e2e.passed + this.results.e2e.failed;

      if (this.results.e2e.failed === 0) {
        this.log(`✅ Testes E2E: ${this.results.e2e.passed} passaram`, 'success');
      } else {
        this.log(`❌ Testes E2E: ${this.results.e2e.failed} falharam`, 'error');
      }

      return this.results.e2e.failed === 0;
    } catch (error) {
      this.log('❌ Erro ao executar testes E2E', 'error');
      this.log(error.message, 'error');
      return false;
    }
  }

  async waitForServer(url, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) return true;
      } catch (error) {
        // Continuar tentando
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Servidor não respondeu em ${url} após ${timeout}ms`);
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalPassed = this.results.unit.passed + this.results.integration.passed + this.results.e2e.passed;
    const totalFailed = this.results.unit.failed + this.results.integration.failed + this.results.e2e.failed;
    const totalTests = totalPassed + totalFailed;

    this.log('\n📊 RELATÓRIO DE TESTES DE AUTENTICAÇÃO', 'info');
    this.log('=' .repeat(50), 'info');
    
    this.log(`⏱️  Duração total: ${Math.round(duration / 1000)}s`, 'info');
    this.log(`📈 Total de testes: ${totalTests}`, 'info');
    this.log(`✅ Passaram: ${totalPassed}`, 'success');
    this.log(`❌ Falharam: ${totalFailed}`, totalFailed > 0 ? 'error' : 'info');
    
    this.log('\n📋 Detalhes por categoria:', 'info');
    this.log(`   🧪 Unitários: ${this.results.unit.passed}/${this.results.unit.total}`, 'info');
    this.log(`   🔗 Integração: ${this.results.integration.passed}/${this.results.integration.total}`, 'info');
    this.log(`   🌐 E2E: ${this.results.e2e.passed}/${this.results.e2e.total}`, 'info');

    // Calcular cobertura (simulada)
    const coverage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    this.log(`\n📊 Taxa de sucesso: ${coverage}%`, coverage >= 90 ? 'success' : 'warning');

    // Salvar relatório em arquivo
    const report = {
      timestamp: new Date().toISOString(),
      duration: Math.round(duration / 1000),
      results: this.results,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: coverage
      }
    };

    fs.writeFileSync('auth-test-report.json', JSON.stringify(report, null, 2));
    this.log('💾 Relatório salvo em: auth-test-report.json', 'info');

    return totalFailed === 0;
  }

  async run() {
    try {
      this.log('🚀 Iniciando execução de testes de autenticação', 'info');
      
      await this.checkPrerequisites();

      const unitSuccess = await this.runUnitTests();
      const integrationSuccess = await this.runIntegrationTests();
      const e2eSuccess = await this.runE2ETests();

      const allSuccess = this.generateReport();

      if (allSuccess) {
        this.log('\n🎉 Todos os testes de autenticação passaram!', 'success');
        process.exit(0);
      } else {
        this.log('\n💥 Alguns testes falharam. Verifique o relatório.', 'error');
        process.exit(1);
      }

    } catch (error) {
      this.log(`💥 Erro fatal: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const runner = new AuthTestRunner();
  runner.run();
}

module.exports = AuthTestRunner;
