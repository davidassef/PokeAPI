#!/usr/bin/env node

/**
 * Script para limpar cache e arquivos temporários que podem causar loops de recompilação
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_CLEAN = [
  '.angular',
  'node_modules/.cache',
  'www',
  'dist',
  'test-results',
  'playwright-report/data',
  '.tmp',
  'tmp'
];

const FILES_TO_CLEAN = [
  '*.log',
  '*.tmp',
  '*.temp',
  'debug-*.png',
  'debug-*.html'
];

/**
 * Remove um diretório recursivamente
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dirPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao remover ${dirPath}: ${error.message}`);
      return false;
    }
  } else {
    console.log(`⏭️ Não existe: ${dirPath}`);
    return true;
  }
}

/**
 * Remove arquivos por padrão
 */
function removeFilesByPattern(pattern) {
  const glob = require('glob');
  
  try {
    const files = glob.sync(pattern, { ignore: 'node_modules/**' });
    
    files.forEach(file => {
      try {
        fs.unlinkSync(file);
        console.log(`✅ Removido arquivo: ${file}`);
      } catch (error) {
        console.log(`❌ Erro ao remover arquivo ${file}: ${error.message}`);
      }
    });
    
    return files.length;
  } catch (error) {
    console.log(`❌ Erro ao buscar arquivos ${pattern}: ${error.message}`);
    return 0;
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🧹 Limpando cache e arquivos temporários...');
  console.log('=' .repeat(50));
  
  let totalCleaned = 0;
  
  // Limpar diretórios
  console.log('\n📁 Limpando diretórios:');
  DIRECTORIES_TO_CLEAN.forEach(dir => {
    if (removeDirectory(dir)) {
      totalCleaned++;
    }
  });
  
  // Limpar arquivos por padrão
  console.log('\n📄 Limpando arquivos temporários:');
  FILES_TO_CLEAN.forEach(pattern => {
    const count = removeFilesByPattern(pattern);
    if (count > 0) {
      console.log(`✅ Removidos ${count} arquivos: ${pattern}`);
      totalCleaned += count;
    }
  });
  
  // Limpar cache do npm se existir
  console.log('\n📦 Limpando cache do npm:');
  try {
    const { execSync } = require('child_process');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ Cache do npm limpo');
  } catch (error) {
    console.log('⚠️ Não foi possível limpar cache do npm:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`🎉 Limpeza concluída! ${totalCleaned} itens removidos.`);
  console.log('\n💡 Dicas para evitar loops de recompilação:');
  console.log('   • Execute este script quando houver problemas');
  console.log('   • Evite editar arquivos em www/ ou dist/');
  console.log('   • Use .gitignore para ignorar arquivos temporários');
  console.log('   • Reinicie o servidor de desenvolvimento após a limpeza');
  
  console.log('\n🚀 Para reiniciar o desenvolvimento:');
  console.log('   npm start');
}

// Verificar se glob está disponível
try {
  require('glob');
} catch (error) {
  console.log('⚠️ Módulo "glob" não encontrado. Instalando...');
  try {
    const { execSync } = require('child_process');
    execSync('npm install glob --save-dev', { stdio: 'inherit' });
    console.log('✅ Módulo "glob" instalado com sucesso');
  } catch (installError) {
    console.log('❌ Erro ao instalar "glob":', installError.message);
    console.log('💡 Execute manualmente: npm install glob --save-dev');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { removeDirectory, removeFilesByPattern };
