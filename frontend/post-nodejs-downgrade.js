#!/usr/bin/env node

/**
 * Script para executar após o downgrade do Node.js
 * Automatiza a reinstalação de dependências e verificação do funcionamento
 */

const fs = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🔄 SCRIPT PÓS-DOWNGRADE NODE.JS');
console.log('=' .repeat(50));

// 1. Verificar versão do Node.js
console.log('\n1. 📋 Verificando versão do Node.js...');
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion === 20 || majorVersion === 18) {
    console.log(`✅ Versão compatível detectada (v${majorVersion}.x LTS)`);
  } else if (majorVersion % 2 !== 0) {
    console.log(`⚠️ AVISO: Versão ímpar detectada (v${majorVersion}.x) - não recomendada`);
  } else {
    console.log(`ℹ️ Versão par detectada (v${majorVersion}.x)`);
  }
} catch (error) {
  console.log('❌ Erro ao verificar versão do Node.js:', error.message);
  process.exit(1);
}

// 2. Verificar se estamos no diretório correto
if (!fs.existsSync('package.json')) {
  console.log('❌ Erro: package.json não encontrado');
  console.log('Execute este script no diretório frontend/');
  process.exit(1);
}

// 3. Backup do package-lock.json se existir
console.log('\n2. 💾 Fazendo backup de arquivos...');
if (fs.existsSync('package-lock.json')) {
  try {
    fs.copyFileSync('package-lock.json', 'package-lock.json.backup');
    console.log('✅ Backup do package-lock.json criado');
  } catch (error) {
    console.log('⚠️ Aviso: Não foi possível criar backup do package-lock.json');
  }
}

// 4. Remover node_modules e package-lock.json
console.log('\n3. 🧹 Limpando dependências antigas...');
try {
  if (fs.existsSync('node_modules')) {
    console.log('🗑️ Removendo node_modules...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('✅ node_modules removido');
  }
  
  if (fs.existsSync('package-lock.json')) {
    console.log('🗑️ Removendo package-lock.json...');
    fs.unlinkSync('package-lock.json');
    console.log('✅ package-lock.json removido');
  }
} catch (error) {
  console.log('❌ Erro ao limpar dependências:', error.message);
  process.exit(1);
}

// 5. Limpar cache do npm
console.log('\n4. 🧽 Limpando cache do npm...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ Cache do npm limpo');
} catch (error) {
  console.log('⚠️ Aviso: Não foi possível limpar o cache do npm');
}

// 6. Reinstalar dependências
console.log('\n5. 📦 Reinstalando dependências...');
try {
  console.log('⏳ Executando npm install...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências reinstaladas com sucesso');
} catch (error) {
  console.log('❌ Erro ao reinstalar dependências:', error.message);
  console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
  console.log('1. Verificar conexão com a internet');
  console.log('2. Tentar: npm install --legacy-peer-deps');
  console.log('3. Verificar se o Node.js foi instalado corretamente');
  process.exit(1);
}

// 7. Verificar Angular CLI
console.log('\n6. 🔧 Verificando Angular CLI...');
try {
  const ngVersion = execSync('npx ng version', { encoding: 'utf8' });
  console.log('✅ Angular CLI funcionando');
  
  if (ngVersion.includes('Unsupported')) {
    console.log('⚠️ AVISO: Ainda há avisos de incompatibilidade');
  } else {
    console.log('✅ Sem avisos de incompatibilidade detectados');
  }
} catch (error) {
  console.log('❌ Erro ao verificar Angular CLI:', error.message);
}

// 8. Testar servidor de desenvolvimento
console.log('\n7. 🚀 Testando servidor de desenvolvimento...');
console.log('⏳ Iniciando servidor de teste...');

const testServer = spawn('npx', ['ng', 'serve', '--port', '4200'], {
  stdio: 'pipe',
  shell: true
});

let serverOutput = '';
let serverStarted = false;

testServer.stdout.on('data', (data) => {
  const text = data.toString();
  serverOutput += text;
  
  if (text.includes('Local:') || text.includes('served at') || text.includes('Development Server is listening')) {
    serverStarted = true;
    console.log('✅ Servidor iniciado com sucesso!');
    console.log('🌐 URL: http://localhost:4200');
    
    // Parar o servidor após 3 segundos
    setTimeout(() => {
      testServer.kill();
    }, 3000);
  }
});

testServer.stderr.on('data', (data) => {
  const text = data.toString();
  serverOutput += text;
  
  if (text.includes('Schema validation failed') || 
      text.includes('must be number') ||
      text.includes('Unsupported')) {
    console.log('⚠️ Avisos detectados:', text.trim());
  }
});

testServer.on('close', (code) => {
  if (serverStarted) {
    console.log('\n🎉 SUCESSO! Node.js downgrade concluído com êxito!');
    console.log('\n📋 RESUMO:');
    console.log('✅ Node.js versão compatível instalada');
    console.log('✅ Dependências reinstaladas');
    console.log('✅ Servidor frontend funcionando');
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Execute: npm start');
    console.log('2. Acesse: http://localhost:4200');
    console.log('3. Teste as funcionalidades da aplicação');
  } else {
    console.log('\n❌ FALHA: Servidor não iniciou corretamente');
    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    console.log('1. Verificar se a versão do Node.js é LTS (v20.x ou v18.x)');
    console.log('2. Tentar manualmente: npm start');
    console.log('3. Verificar logs de erro acima');
    console.log('4. Consultar: frontend/NODEJS_COMPATIBILITY_ISSUE.md');
  }
  
  process.exit(serverStarted ? 0 : 1);
});

// Timeout de segurança
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏰ Timeout: Servidor não respondeu em 30 segundos');
    testServer.kill();
  }
}, 30000);
