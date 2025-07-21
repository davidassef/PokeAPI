#!/usr/bin/env node

/**
 * Script simples para iniciar o servidor frontend
 * Resolve problemas de configuração e inicia o servidor
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO SERVIDOR FRONTEND');
console.log('=' .repeat(40));

// 1. Verificar se estamos no diretório correto
if (!fs.existsSync('package.json')) {
  console.log('❌ Erro: package.json não encontrado');
  console.log('Execute este script no diretório frontend/');
  process.exit(1);
}

// 2. Verificar se node_modules existe
if (!fs.existsSync('node_modules')) {
  console.log('❌ Erro: node_modules não encontrado');
  console.log('Execute: npm install');
  process.exit(1);
}

// 3. Limpar cache se existir
console.log('🧹 Limpando cache...');
if (fs.existsSync('.angular')) {
  try {
    const { execSync } = require('child_process');
    execSync('npx ng cache clean', { stdio: 'inherit' });
    console.log('✅ Cache limpo');
  } catch (error) {
    console.log('⚠️ Aviso: Não foi possível limpar o cache');
  }
}

// 4. Verificar e corrigir arquivos de configuração
console.log('🔧 Verificando configurações...');

// Verificar angular.json
try {
  const angularJson = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
  let modified = false;
  
  // Remover campos poll problemáticos
  if (angularJson.projects && angularJson.projects.app && angularJson.projects.app.architect) {
    const architect = angularJson.projects.app.architect;
    
    if (architect.serve && architect.serve.options && typeof architect.serve.options.poll !== 'undefined') {
      delete architect.serve.options.poll;
      modified = true;
    }
    
    if (architect.serve && architect.serve.configurations && architect.serve.configurations.development) {
      const devConfig = architect.serve.configurations.development;
      if (typeof devConfig.poll !== 'undefined') {
        delete devConfig.poll;
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync('angular.json', JSON.stringify(angularJson, null, 2));
    console.log('✅ angular.json corrigido');
  } else {
    console.log('✅ angular.json OK');
  }
} catch (error) {
  console.log('❌ Erro ao verificar angular.json:', error.message);
}

// 5. Tentar diferentes comandos de inicialização
const commands = [
  {
    name: 'Angular CLI (sem proxy)',
    cmd: 'npx',
    args: ['ng', 'serve', '--port', '4200', '--host', 'localhost']
  },
  {
    name: 'Angular CLI (com proxy)',
    cmd: 'npx',
    args: ['ng', 'serve', '--port', '4200', '--host', 'localhost', '--proxy-config', 'proxy.conf.json']
  },
  {
    name: 'Ionic CLI',
    cmd: 'npx',
    args: ['ionic', 'serve', '--port', '4200']
  }
];

let currentCommandIndex = 0;

function tryNextCommand() {
  if (currentCommandIndex >= commands.length) {
    console.log('❌ Todos os comandos falharam');
    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    console.log('1. Reinstalar dependências: rm -rf node_modules && npm install');
    console.log('2. Verificar versão do Node.js: node --version');
    console.log('3. Atualizar Angular CLI: npm install -g @angular/cli@latest');
    console.log('4. Verificar se há processos travados: tasklist | findstr node');
    process.exit(1);
  }
  
  const command = commands[currentCommandIndex];
  console.log(`\n🔄 Tentando: ${command.name}`);
  console.log(`Comando: ${command.cmd} ${command.args.join(' ')}`);
  
  const serverProcess = spawn(command.cmd, command.args, {
    stdio: 'pipe',
    shell: true
  });
  
  let hasOutput = false;
  let hasError = false;
  
  serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    hasOutput = true;
    console.log('📤', text.trim());
    
    // Verificar se o servidor iniciou com sucesso
    if (text.includes('Local:') || text.includes('served at') || text.includes('Development Server is listening')) {
      console.log('\n✅ SERVIDOR INICIADO COM SUCESSO!');
      console.log('🌐 Acesse: http://localhost:4200');
      console.log('⏹️ Para parar: Ctrl+C');
      
      // Manter o processo rodando
      process.on('SIGINT', () => {
        console.log('\n🛑 Parando servidor...');
        serverProcess.kill();
        process.exit(0);
      });
      
      return;
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    const text = data.toString();
    hasOutput = true;
    console.log('📥', text.trim());
    
    // Verificar se há erros críticos
    if (text.includes('Schema validation failed') || 
        text.includes('poll') || 
        text.includes('must be number') ||
        text.includes('EADDRINUSE')) {
      hasError = true;
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n📊 ${command.name} finalizado com código: ${code}`);
    
    if (code !== 0 || hasError) {
      console.log(`❌ ${command.name} falhou`);
      currentCommandIndex++;
      setTimeout(tryNextCommand, 1000);
    }
  });
  
  // Timeout para comandos que não respondem
  setTimeout(() => {
    if (!hasOutput) {
      console.log(`⏰ ${command.name} não respondeu em 30s, tentando próximo...`);
      serverProcess.kill();
      currentCommandIndex++;
      setTimeout(tryNextCommand, 1000);
    }
  }, 30000);
}

// Iniciar tentativas
tryNextCommand();
