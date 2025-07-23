#!/usr/bin/env node

/**
 * Script de Limpeza Otimizado para Desenvolvimento
 * 
 * Este script resolve problemas de loop de compilação limpando:
 * - Cache do Angular (.angular/cache)
 * - Arquivos temporários de build
 * - Logs de desenvolvimento
 * - Cache do Node.js
 * 
 * Uso: node scripts/clean-dev-optimized.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração de cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

// Função para remover diretório recursivamente
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      logError(`Erro ao remover ${dirPath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

// Função para remover arquivo
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      logError(`Erro ao remover ${filePath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

// Função para obter tamanho de diretório
function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
  } catch (error) {
    // Ignorar erros de acesso
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  log(`${colors.bright}🧹 Script de Limpeza Otimizado para Desenvolvimento${colors.reset}`);
  log(`${colors.blue}Resolvendo problemas de loop de compilação...${colors.reset}\n`);

  const startTime = Date.now();
  let totalSpaceFreed = 0;

  // Lista de diretórios e arquivos para limpar
  const cleanupTargets = [
    // Cache do Angular
    { path: '.angular/cache', type: 'dir', description: 'Cache do Angular' },
    { path: '.angular', type: 'dir', description: 'Diretório Angular completo' },
    
    // Arquivos de build
    { path: 'www', type: 'dir', description: 'Arquivos de build (www)' },
    { path: 'dist', type: 'dir', description: 'Arquivos de build (dist)' },
    
    // Cache do Node.js
    { path: 'node_modules/.cache', type: 'dir', description: 'Cache do Node.js' },
    
    // Logs e arquivos temporários
    { path: 'npm-debug.log*', type: 'glob', description: 'Logs do NPM' },
    { path: 'yarn-debug.log*', type: 'glob', description: 'Logs do Yarn' },
    { path: 'yarn-error.log*', type: 'glob', description: 'Erros do Yarn' },
    { path: '*.log', type: 'glob', description: 'Arquivos de log' },
    { path: '*.tmp', type: 'glob', description: 'Arquivos temporários' },
    { path: '*.temp', type: 'glob', description: 'Arquivos temporários' },
    
    // Arquivos de teste
    { path: 'test-results', type: 'dir', description: 'Resultados de testes' },
    { path: 'playwright-report', type: 'dir', description: 'Relatórios do Playwright' },
    { path: 'coverage', type: 'dir', description: 'Relatórios de cobertura' },
    
    // Cache do TypeScript
    { path: '*.tsbuildinfo', type: 'glob', description: 'Cache do TypeScript' }
  ];

  // Executar limpeza
  for (let i = 0; i < cleanupTargets.length; i++) {
    const target = cleanupTargets[i];
    logStep(`${i + 1}/${cleanupTargets.length}`, `Limpando: ${target.description}`);
    
    const targetPath = path.resolve(target.path);
    
    if (target.type === 'dir') {
      const sizeBefore = getDirectorySize(targetPath);
      if (removeDirectory(targetPath)) {
        totalSpaceFreed += sizeBefore;
        logSuccess(`Removido: ${target.path} (${formatBytes(sizeBefore)})`);
      } else if (fs.existsSync(targetPath)) {
        logWarning(`Não foi possível remover: ${target.path}`);
      } else {
        log(`Não encontrado: ${target.path}`);
      }
    } else if (target.type === 'glob') {
      // Para padrões glob, usar find simples
      try {
        const files = fs.readdirSync('.').filter(file => {
          if (target.path.includes('*')) {
            const pattern = target.path.replace(/\*/g, '.*');
            return new RegExp(pattern).test(file);
          }
          return file === target.path;
        });
        
        let filesRemoved = 0;
        let sizeRemoved = 0;
        
        for (const file of files) {
          const filePath = path.resolve(file);
          if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath).size;
            if (removeFile(filePath)) {
              filesRemoved++;
              sizeRemoved += size;
            }
          }
        }
        
        if (filesRemoved > 0) {
          totalSpaceFreed += sizeRemoved;
          logSuccess(`Removidos ${filesRemoved} arquivos (${formatBytes(sizeRemoved)})`);
        } else {
          log(`Nenhum arquivo encontrado para: ${target.path}`);
        }
      } catch (error) {
        logError(`Erro ao processar padrão ${target.path}: ${error.message}`);
      }
    }
  }

  // Limpar cache do npm se disponível
  logStep('EXTRA', 'Limpando cache do NPM...');
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
    logSuccess('Cache do NPM limpo');
  } catch (error) {
    logWarning('Não foi possível limpar cache do NPM');
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log(`\n${colors.bright}📊 Resumo da Limpeza:${colors.reset}`);
  log(`${colors.green}✅ Espaço liberado: ${formatBytes(totalSpaceFreed)}${colors.reset}`);
  log(`${colors.blue}⏱️  Tempo decorrido: ${duration}s${colors.reset}`);
  
  log(`\n${colors.bright}🚀 Próximos passos:${colors.reset}`);
  log(`${colors.cyan}1. Execute: npm start${colors.reset}`);
  log(`${colors.cyan}2. Aguarde a compilação inicial${colors.reset}`);
  log(`${colors.cyan}3. Verifique se não há mais loops de recompilação${colors.reset}`);
  
  log(`\n${colors.green}✅ Limpeza concluída com sucesso!${colors.reset}`);
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    logError(`Erro durante a limpeza: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
