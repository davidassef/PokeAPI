#!/usr/bin/env node

/**
 * Script para verificar se a configuração de build está correta
 * Especialmente importante para deployments no Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração de build...\n');

// 1. Verificar se os arquivos de environment existem
const envFiles = [
  'src/environments/environment.ts',
  'src/environments/environment.prod.ts'
];

console.log('📁 Verificando arquivos de environment:');
envFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - OK`);
    
    // Ler conteúdo e mostrar URL da API
    const content = fs.readFileSync(fullPath, 'utf8');
    const apiUrlMatch = content.match(/apiUrl:\s*['"`]([^'"`]+)['"`]/);
    if (apiUrlMatch) {
      console.log(`   📡 API URL: ${apiUrlMatch[1]}`);
    }
  } else {
    console.log(`❌ ${file} - FALTANDO`);
  }
});

// 2. Verificar angular.json
console.log('\n📋 Verificando angular.json:');
const angularJsonPath = path.join(__dirname, '..', 'angular.json');
if (fs.existsSync(angularJsonPath)) {
  try {
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    const prodConfig = angularJson.projects.app.architect.build.configurations.production;
    
    if (prodConfig && prodConfig.fileReplacements) {
      console.log('✅ Configuração de produção encontrada');
      console.log('✅ fileReplacements configurado:');
      prodConfig.fileReplacements.forEach(replacement => {
        console.log(`   📝 ${replacement.replace} → ${replacement.with}`);
      });
    } else {
      console.log('❌ Configuração de produção não encontrada ou incompleta');
    }
  } catch (error) {
    console.log('❌ Erro ao ler angular.json:', error.message);
  }
} else {
  console.log('❌ angular.json não encontrado');
}

// 3. Verificar package.json scripts
console.log('\n🚀 Verificando scripts de build:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const buildScripts = ['build', 'build:prod', 'build:vercel'];
    
    buildScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
      } else {
        console.log(`❌ ${script}: não encontrado`);
      }
    });
  } catch (error) {
    console.log('❌ Erro ao ler package.json:', error.message);
  }
} else {
  console.log('❌ package.json não encontrado');
}

// 4. Verificar vercel.json
console.log('\n🌐 Verificando vercel.json:');
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    console.log(`✅ Build command: ${vercelJson.buildCommand}`);
    console.log(`✅ Output directory: ${vercelJson.outputDirectory}`);
    
    if (vercelJson.env) {
      console.log('✅ Environment variables:');
      Object.entries(vercelJson.env).forEach(([key, value]) => {
        console.log(`   🔧 ${key}: ${value}`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao ler vercel.json:', error.message);
  }
} else {
  console.log('❌ vercel.json não encontrado');
}

// 5. Verificar se o diretório de build existe
console.log('\n📦 Verificando diretório de build:');
const buildDir = path.join(__dirname, '..', 'www');
if (fs.existsSync(buildDir)) {
  console.log('✅ Diretório www/ existe');
  
  // Verificar se há arquivos de build
  const files = fs.readdirSync(buildDir);
  if (files.length > 0) {
    console.log(`✅ ${files.length} arquivos encontrados no build`);
    
    // Verificar se há um main.js (indicativo de build Angular)
    const mainFiles = files.filter(f => f.startsWith('main.') && f.endsWith('.js'));
    if (mainFiles.length > 0) {
      console.log(`✅ Arquivo main.js encontrado: ${mainFiles[0]}`);
    }
  } else {
    console.log('⚠️  Diretório www/ está vazio');
  }
} else {
  console.log('⚠️  Diretório www/ não existe (normal se não foi buildado ainda)');
}

// 6. Recomendações
console.log('\n💡 Recomendações:');
console.log('1. Execute "npm run build:vercel" para testar o build localmente');
console.log('2. Verifique se o arquivo www/main.*.js contém a URL correta da API');
console.log('3. No Vercel, certifique-se de que está usando o comando "npm run build:vercel"');
console.log('4. Após deploy, verifique se a URL da API está correta no console do navegador');

console.log('\n✅ Verificação concluída!');
