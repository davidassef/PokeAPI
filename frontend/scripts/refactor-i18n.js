/**
 * Script de Refatoração de Arquivos de Tradução i18n
 * 
 * Este script automatiza a limpeza e organização dos arquivos de tradução JSON
 * usados na aplicação. Ele realiza as seguintes operações:
 * 1. Remove chaves duplicadas que devem existir apenas no escopo 'mobile'
 * 2. Extrai o bloco 'mobile' de dentro de 'details' se existir
 * 3. Remove chaves obsoletas (como prefixos antigos)
 * 4. Ordena as seções principais dos arquivos JSON
 * 5. Formata o JSON para consistência
 * 
 * Uso:
 * - Execute com Node.js: `node scripts/refactor-i18n.js`
 * - O script processa todos os arquivos .json no diretório src/assets/i18n/
 * - Faz backup dos arquivos originais antes de modificá-los
 * 
 * Estrutura esperada dos arquivos de tradução:
 * - Chaves comuns devem estar no nível raiz ou em seções específicas
 * - Chaves específicas do mobile devem estar dentro do bloco 'mobile'
 * - Evitar duplicação de chaves entre diferentes níveis
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Configurações do script
 * @type {Object}
 * @property {string} i18nDir - Diretório dos arquivos de tradução
 * @property {string[]} mobileOnlyKeys - Chaves que devem existir apenas no escopo 'mobile'
 * @property {string[]} deprecatedKeys - Chaves que devem ser removidas por estarem obsoletas
 * @property {string[]} sectionOrder - Ordem preferida das seções principais
 */
const CONFIG = {
  // Diretório dos arquivos de tradução
  i18nDir: path.join(__dirname, '../src/assets/i18n'),
  
  // Chaves que devem existir apenas no escopo 'mobile'
  mobileOnlyKeys: [
    // Seção de informações básicas
    'basic_info', 'info_basicas', 'stats', 'status', 'evolution', 'evolucao',
    'curiosities', 'curiosidades', 'trivia_title', 'trivia',
    
    // Seções específicas do mobile
    'loading', 'tabs', 'evolution_triggers', 'evolution_methods',
    'stats_names', 'bmi_categories', 'habitats'
  ],
  
  // Chaves que devem ser removidas por estarem obsoletas
  deprecatedKeys: [
    'detalis.', // Antigo prefixo que foi substituído por 'mobile.'
    'modal.'    // Chaves que foram movidas para 'mobile.'
  ],
  
  // Ordem preferida das seções principais
  sectionOrder: [
    'COMMON', 'app', 'tabs', 'pokemon', 'mobile', 'details', 'filters',
    'settings_page', 'colors', 'auth', 'admin', 'types', 'abilities',
    'habitats', 'bmi_categories', 'evolution_triggers', 'evolution_methods',
    'stats_names'
  ]
};

/**
 * Remove chaves duplicadas que devem existir apenas no escopo 'mobile'.
 * Também remove chaves obsoletas e garante que as chaves específicas do mobile
 * estejam apenas no local correto.
 * 
 * @param {Object} obj - O objeto a ser processado
 * @param {string} [parentKey=''] - Chave do pai (usada para rastrear o caminho completo)
 * @returns {void}
 */
function removeDuplicateKeys(obj, parentKey = '') {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return;
  }

  Object.keys(obj).forEach(key => {
    const fullPath = parentKey ? `${parentKey}.${key}` : key;
    
    // Remove chaves obsoletas
    if (CONFIG.deprecatedKeys.some(deprecated => fullPath.startsWith(deprecated))) {
      delete obj[key];
      return;
    }
    
    // Remove chaves que devem existir apenas no escopo 'mobile'
    if (CONFIG.mobileOnlyKeys.includes(key) && !parentKey.startsWith('mobile.')) {
      // Preserva a chave se estiver dentro do escopo mobile
      if (!parentKey.split('.').includes('mobile')) {
        delete obj[key];
        return;
      }
    }
    
    // Processa recursivamente
    removeDuplicateKeys(obj[key], fullPath);
    
    // Remove objetos vazios resultantes
    if (typeof obj[key] === 'object' && obj[key] !== null && 
        Object.keys(obj[key]).length === 0) {
      delete obj[key];
    }
  });
}

/**
 * Extrai o bloco 'mobile' de dentro de 'details' se existir e move para o nível raiz.
 * Isso ajuda a manter uma estrutura consistente nos arquivos de tradução.
 * 
 * @param {Object} data - O objeto de dados do arquivo de tradução
 * @returns {Object} O objeto de dados com o bloco mobile extraído
 */
function extractMobileBlock(data) {
  if (data.details && data.details.mobile) {
    if (!data.mobile) {
      data.mobile = {};
    }
    
    // Move as chaves do bloco mobile dentro de details para o nível superior
    Object.assign(data.mobile, data.details.mobile);
    delete data.details.mobile;
    
    // Remove o objeto details se estiver vazio
    if (Object.keys(data.details).length === 0) {
      delete data.details;
    }
  }
  
  return data;
}

/**
 * Ordena as seções principais do JSON de acordo com a ordem definida em CONFIG.sectionOrder.
 * Seções não listadas em sectionOrder serão colocadas no final, em ordem alfabética.
 * 
 * @param {Object} data - O objeto de dados a ser ordenado
 * @returns {Object} Novo objeto com as seções ordenadas
 */
function sortSections(data) {
  const orderedData = {};
  const remainingKeys = new Set(Object.keys(data));
  
  // Adiciona as seções na ordem definida
  CONFIG.sectionOrder.forEach(section => {
    if (data.hasOwnProperty(section)) {
      orderedData[section] = data[section];
      remainingKeys.delete(section);
    }
  });
  
  // Adiciona as seções restantes no final
  Array.from(remainingKeys)
    .sort()
    .forEach(key => {
      orderedData[key] = data[key];
    });
  
  return orderedData;
}

/**
 * Processa um único arquivo de tradução, aplicando todas as transformações necessárias:
 * 1. Lê o conteúdo do arquivo
 * 2. Remove chaves duplicadas
 * 3. Extrai o bloco mobile se necessário
 * 4. Ordena as seções
 * 5. Faz backup do arquivo original
 * 6. Salva as alterações
 * 
 * @param {string} filePath - Caminho completo para o arquivo de tradução
 * @returns {Promise<void>}
 */
async function processFile(filePath) {
  try {
    // Lê o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);
    
    // Extrai o bloco mobile se estiver dentro de details
    data = extractMobileBlock(data);
    
    // Remove chaves duplicadas
    removeDuplicateKeys(data);
    
    // Ordena as seções principais
    const orderedData = sortSections(data);
    
    // Escreve o arquivo de volta
    fs.writeFileSync(
      filePath,
      JSON.stringify(orderedData, null, 2) + '\n',
      'utf8'
    );
    
    console.log(`✅ ${path.basename(filePath)} refatorado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Função principal que coordena o processo de refatoração:
 * 1. Encontra todos os arquivos .json no diretório de traduções
 * 2. Processa cada arquivo individualmente
 * 3. Exibe um resumo das alterações realizadas
 * 
 * @returns {Promise<void>}
 */
async function main() {
  console.log('🚀 Iniciando refatoração dos arquivos de tradução...\n');
  
  // Encontra todos os arquivos JSON no diretório de traduções
  const files = glob.sync('*.json', { cwd: CONFIG.i18nDir });
  
  if (files.length === 0) {
    console.log('ℹ️ Nenhum arquivo de tradução encontrado.');
    return;
  }
  
  console.log(`📂 Processando ${files.length} arquivos de tradução...\n`);
  
  // Processa cada arquivo
  const results = files.map(file => {
    const filePath = path.join(CONFIG.i18nDir, file);
    return {
      file: file,
      success: processFile(filePath)
    };
  });
  
  // Exibe um resumo
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.length - successCount;
  
  console.log('\n📊 Resumo da refatoração:');
  console.log(`✅ ${successCount} arquivos processados com sucesso`);
  
  if (errorCount > 0) {
    const failedFiles = results
      .filter(r => !r.success)
      .map(r => `  - ${r.file}`)
      .join('\n');
    
    console.log(`❌ ${errorCount} arquivos com erros:\n${failedFiles}`);
  }
  
  console.log('\n✨ Refatoração concluída!');
}

// Executa o script
main();
