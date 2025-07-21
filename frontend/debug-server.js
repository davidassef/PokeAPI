#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas do servidor frontend
 * Identifica e resolve problemas comuns de inicialização
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('🔍 DIAGNÓSTICO DO SERVIDOR FRONTEND');
console.log('=' .repeat(50));

// 1. Verificar Node.js version
console.log('\n1. 📋 Verificando versão do Node.js...');
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion % 2 !== 0) {
    console.log('⚠️  AVISO: Versão ímpar do Node.js detectada (não recomendada para produção)');
  }
} catch (error) {
  console.log('❌ Erro ao verificar versão do Node.js:', error.message);
}

// 2. Verificar arquivos de configuração
console.log('\n2. 📁 Verificando arquivos de configuração...');

const configFiles = [
  'package.json',
  'angular.json',
  'proxy.conf.json',
  'ionic.config.json'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} existe`);
    
    // Verificar sintaxe JSON
    try {
      const content = fs.readFileSync(file, 'utf8');
      JSON.parse(content);
      console.log(`✅ ${file} tem sintaxe JSON válida`);
    } catch (error) {
      console.log(`❌ ${file} tem sintaxe JSON inválida:`, error.message);
    }
  } else {
    console.log(`❌ ${file} não encontrado`);
  }
});

// 3. Verificar dependências
console.log('\n3. 📦 Verificando dependências...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const criticalDeps = [
    '@angular/core',
    '@angular/cli',
    '@ionic/angular',
    'typescript'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`);
    } else {
      console.log(`❌ ${dep}: não encontrado`);
    }
  });
} catch (error) {
  console.log('❌ Erro ao verificar dependências:', error.message);
}

// 4. Verificar angular.json
console.log('\n4. ⚙️  Verificando configuração do Angular...');
try {
  const angularJson = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
  
  // Verificar configuração de serve
  if (angularJson.projects && angularJson.projects.app && angularJson.projects.app.architect && angularJson.projects.app.architect.serve) {
    const serveConfig = angularJson.projects.app.architect.serve;
    console.log('✅ Configuração de serve encontrada');
    
    // Verificar campo poll problemático
    if (serveConfig.options && typeof serveConfig.options.poll !== 'undefined') {
      if (typeof serveConfig.options.poll === 'boolean') {
        console.log('❌ Campo "poll" é boolean (deve ser number ou undefined)');
        console.log('🔧 Corrigindo...');
        delete serveConfig.options.poll;
        fs.writeFileSync('angular.json', JSON.stringify(angularJson, null, 2));
        console.log('✅ Campo "poll" removido');
      } else if (typeof serveConfig.options.poll === 'number') {
        console.log(`✅ Campo "poll" é number: ${serveConfig.options.poll}`);
      }
    }
    
    // Verificar configurações de desenvolvimento
    if (serveConfig.configurations && serveConfig.configurations.development) {
      const devConfig = serveConfig.configurations.development;
      if (typeof devConfig.poll !== 'undefined' && typeof devConfig.poll === 'boolean') {
        console.log('❌ Campo "poll" em development é boolean');
        console.log('🔧 Corrigindo...');
        delete devConfig.poll;
        fs.writeFileSync('angular.json', JSON.stringify(angularJson, null, 2));
        console.log('✅ Campo "poll" em development removido');
      }
    }
  } else {
    console.log('❌ Configuração de serve não encontrada');
  }
} catch (error) {
  console.log('❌ Erro ao verificar angular.json:', error.message);
}

// 5. Verificar proxy.conf.json
console.log('\n5. 🌐 Verificando configuração do proxy...');
try {
  if (fs.existsSync('proxy.conf.json')) {
    const proxyConfig = JSON.parse(fs.readFileSync('proxy.conf.json', 'utf8'));
    console.log('✅ proxy.conf.json carregado');
    console.log('📋 Configuração:', JSON.stringify(proxyConfig, null, 2));
  } else {
    console.log('⚠️  proxy.conf.json não encontrado');
  }
} catch (error) {
  console.log('❌ Erro ao verificar proxy.conf.json:', error.message);
}

// 6. Limpar cache
console.log('\n6. 🧹 Limpando cache...');
try {
  if (fs.existsSync('.angular')) {
    execSync('npx ng cache clean', { stdio: 'inherit' });
    console.log('✅ Cache do Angular limpo');
  }
} catch (error) {
  console.log('❌ Erro ao limpar cache:', error.message);
}

// 7. Tentar iniciar servidor
console.log('\n7. 🚀 Tentando iniciar servidor...');
console.log('Comando: ng serve --port 4200 --host localhost');

const serverProcess = spawn('npx', ['ng', 'serve', '--port', '4200', '--host', 'localhost'], {
  stdio: 'pipe',
  shell: true
});

let output = '';
let hasError = false;

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('📤 STDOUT:', text.trim());
  
  if (text.includes('Local:') || text.includes('served at')) {
    console.log('✅ Servidor iniciado com sucesso!');
    setTimeout(() => {
      serverProcess.kill();
      process.exit(0);
    }, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('📥 STDERR:', text.trim());
  
  if (text.includes('Schema validation failed') || text.includes('poll') || text.includes('must be number')) {
    hasError = true;
    console.log('❌ Erro de validação de schema detectado');
  }
});

serverProcess.on('close', (code) => {
  console.log(`\n📊 Processo finalizado com código: ${code}`);
  
  if (hasError) {
    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    console.log('1. Verificar se todos os campos "poll" foram removidos do angular.json');
    console.log('2. Verificar sintaxe JSON de todos os arquivos de configuração');
    console.log('3. Reinstalar dependências: npm install');
    console.log('4. Tentar sem proxy: ng serve --port 4200');
    console.log('5. Usar Ionic CLI: ionic serve');
  }
  
  process.exit(code);
});

// Timeout de segurança
setTimeout(() => {
  console.log('\n⏰ Timeout atingido, finalizando diagnóstico...');
  serverProcess.kill();
  process.exit(1);
}, 60000); // 60 segundos
