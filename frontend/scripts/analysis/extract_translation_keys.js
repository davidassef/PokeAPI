const fs = require('fs');
const path = require('path');

// Função para extrair chaves de tradução de um arquivo
function extractTranslationKeys(filePath, content) {
  const keys = new Set();
  
  // Padrões para encontrar chaves de tradução
  const patterns = [
    // {{ 'key' | translate }}
    /\{\{\s*'([^']+)'\s*\|\s*translate\s*\}\}/g,
    // [placeholder]="'key' | translate"
    /\[[\w-]+\]="'([^']+)'\s*\|\s*translate"/g,
    // [title]="'key' | translate"
    /\[title\]="'([^']+)'\s*\|\s*translate"/g,
    // translate.instant('key')
    /translate\.instant\(['"]([^'"]+)['"]\)/g,
    // this.translate.instant('key')
    /this\.translate\.instant\(['"]([^'"]+)['"]\)/g,
    // translate.get('key')
    /translate\.get\(['"]([^'"]+)['"]\)/g,
    // this.translate.get('key')
    /this\.translate\.get\(['"]([^'"]+)['"]\)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
  });
  
  return Array.from(keys).sort();
}

// Função para percorrer diretórios recursivamente
function walkDirectory(dir, fileExtensions = ['.html', '.ts']) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pular node_modules e outras pastas desnecessárias
        if (!['node_modules', 'dist', '.git', '.angular'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (fileExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// Função principal
function extractAllTranslationKeys() {
  const srcDir = path.join(__dirname, 'src');
  const files = walkDirectory(srcDir);
  
  const allKeys = new Set();
  const keysByFile = {};
  
  console.log('🔍 Extraindo chaves de tradução...\n');
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const keys = extractTranslationKeys(filePath, content);
      
      if (keys.length > 0) {
        const relativePath = path.relative(srcDir, filePath);
        keysByFile[relativePath] = keys;
        
        keys.forEach(key => allKeys.add(key));
        
        console.log(`📄 ${relativePath}: ${keys.length} chaves`);
        keys.forEach(key => console.log(`   - ${key}`));
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
  });
  
  // Salvar resultado em arquivo JSON
  const result = {
    summary: {
      totalFiles: Object.keys(keysByFile).length,
      totalKeys: allKeys.size,
      extractedAt: new Date().toISOString()
    },
    allKeys: Array.from(allKeys).sort(),
    keysByFile: keysByFile
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'translation_keys_extracted.json'),
    JSON.stringify(result, null, 2)
  );
  
  console.log('📊 RESUMO:');
  console.log(`   Total de arquivos: ${result.summary.totalFiles}`);
  console.log(`   Total de chaves únicas: ${result.summary.totalKeys}`);
  console.log(`   Resultado salvo em: translation_keys_extracted.json`);
  
  return result;
}

// Executar extração
if (require.main === module) {
  extractAllTranslationKeys();
}

module.exports = { extractAllTranslationKeys, extractTranslationKeys };
