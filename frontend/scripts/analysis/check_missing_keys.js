const fs = require('fs');
const path = require('path');

// Função para obter todas as chaves de um objeto aninhado
function getAllKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    }
  }
  
  return keys;
}

// Função para verificar chaves ausentes
function checkMissingKeys() {
  console.log('🔍 Verificando chaves ausentes nos arquivos de tradução...\n');
  
  // Carregar chaves extraídas do código
  const extractedData = JSON.parse(fs.readFileSync('translation_keys_extracted.json', 'utf8'));
  const usedKeys = new Set(extractedData.allKeys);
  
  // Arquivos de tradução
  const translationFiles = [
    'src/assets/i18n/pt-BR.json',
    'src/assets/i18n/en-US.json',
    'src/assets/i18n/es-ES.json',
    'src/assets/i18n/ja-JP.json'
  ];
  
  const results = {};
  
  translationFiles.forEach(filePath => {
    const fileName = path.basename(filePath, '.json');
    console.log(`📄 Analisando ${fileName}...`);
    
    try {
      const translationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const availableKeys = getAllKeys(translationData);
      
      // Encontrar chaves ausentes
      const missingKeys = [];
      usedKeys.forEach(key => {
        if (!availableKeys.has(key)) {
          missingKeys.push(key);
        }
      });
      
      // Encontrar chaves órfãs (definidas mas não usadas)
      const orphanKeys = [];
      availableKeys.forEach(key => {
        if (!usedKeys.has(key)) {
          orphanKeys.push(key);
        }
      });
      
      results[fileName] = {
        totalAvailable: availableKeys.size,
        totalUsed: usedKeys.size,
        missingKeys: missingKeys.sort(),
        orphanKeys: orphanKeys.sort(),
        missingCount: missingKeys.length,
        orphanCount: orphanKeys.length
      };
      
      console.log(`   ✅ Chaves disponíveis: ${availableKeys.size}`);
      console.log(`   🔍 Chaves usadas no código: ${usedKeys.size}`);
      console.log(`   ❌ Chaves ausentes: ${missingKeys.length}`);
      console.log(`   🗑️ Chaves órfãs: ${orphanKeys.length}`);
      
      if (missingKeys.length > 0) {
        console.log(`   📋 Primeiras 10 chaves ausentes:`);
        missingKeys.slice(0, 10).forEach(key => console.log(`      - ${key}`));
        if (missingKeys.length > 10) {
          console.log(`      ... e mais ${missingKeys.length - 10} chaves`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
      results[fileName] = { error: error.message };
    }
  });
  
  // Salvar resultado detalhado
  const detailedResult = {
    summary: {
      totalUsedKeys: usedKeys.size,
      analyzedFiles: translationFiles.length,
      analyzedAt: new Date().toISOString()
    },
    usedKeys: Array.from(usedKeys).sort(),
    results: results
  };
  
  fs.writeFileSync('missing_keys_analysis.json', JSON.stringify(detailedResult, null, 2));
  
  // Resumo geral
  console.log('📊 RESUMO GERAL:');
  console.log(`   Total de chaves usadas no código: ${usedKeys.size}`);
  
  Object.entries(results).forEach(([fileName, data]) => {
    if (!data.error) {
      console.log(`   ${fileName}:`);
      console.log(`     - Ausentes: ${data.missingCount}`);
      console.log(`     - Órfãs: ${data.orphanCount}`);
    }
  });
  
  console.log(`\n📁 Análise detalhada salva em: missing_keys_analysis.json`);
  
  return detailedResult;
}

// Executar verificação
if (require.main === module) {
  checkMissingKeys();
}

module.exports = { checkMissingKeys };
