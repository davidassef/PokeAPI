#!/usr/bin/env node

/**
 * Script de deploy específico para Vercel
 * Garante que o build seja executado corretamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy para Vercel...');

try {
  // Verificar se estamos no diretório correto
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json não encontrado. Execute este script do diretório frontend/');
  }

  console.log('📦 Instalando dependências...');
  execSync('npm ci --production=false', { stdio: 'inherit' });

  console.log('🔧 Executando build de produção...');
  execSync('npm run build:vercel', { stdio: 'inherit' });

  console.log('✅ Build concluído com sucesso!');
  
  // Verificar se o diretório www foi criado
  const wwwPath = path.join(__dirname, '..', 'www');
  if (!fs.existsSync(wwwPath)) {
    throw new Error('Diretório www não foi criado. Verifique o build.');
  }

  console.log('📁 Arquivos de build encontrados em:', wwwPath);
  
  // Listar arquivos principais
  const files = fs.readdirSync(wwwPath);
  console.log('📋 Arquivos principais:', files.slice(0, 10).join(', '));

} catch (error) {
  console.error('❌ Erro durante o deploy:', error.message);
  process.exit(1);
}
