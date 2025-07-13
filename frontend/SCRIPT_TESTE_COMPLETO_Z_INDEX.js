// ===== SCRIPT DE TESTE COMPLETO Z-INDEX =====
// Execute este script no DevTools para validar TODAS as correções de z-index

console.log('🔧 INICIANDO TESTE COMPLETO DE Z-INDEX...\n');
console.log('Este script valida FABs, Music Player, Modais e Hierarquia geral\n');

// ===== 1. VERIFICAR VARIÁVEIS CSS GLOBAIS =====
console.log('📋 1. VERIFICANDO VARIÁVEIS CSS GLOBAIS...');

const rootStyles = getComputedStyle(document.documentElement);
const zIndexVars = {
  'auth-modal': rootStyles.getPropertyValue('--z-auth-modal').trim(),
  'sidemenu': rootStyles.getPropertyValue('--z-sidemenu').trim(),
  'pokemon-modal': rootStyles.getPropertyValue('--z-pokemon-modal').trim(),
  'music-player': rootStyles.getPropertyValue('--z-music-player').trim(),
  'fab': rootStyles.getPropertyValue('--z-fab').trim(),
  'header': rootStyles.getPropertyValue('--z-header').trim(),
  'overlay': rootStyles.getPropertyValue('--z-overlay').trim(),
  'card': rootStyles.getPropertyValue('--z-card').trim()
};

console.log('Variáveis Z-Index definidas:', zIndexVars);

// Verificar hierarquia das variáveis
const expectedHierarchy = [
  { name: 'auth-modal', value: 10000 },
  { name: 'sidemenu', value: 9000 },
  { name: 'pokemon-modal', value: 8000 },
  { name: 'music-player', value: 7000 },
  { name: 'fab', value: 6000 },
  { name: 'header', value: 5000 },
  { name: 'overlay', value: 4000 },
  { name: 'card', value: 1000 }
];

let hierarchyCorrect = true;
expectedHierarchy.forEach(({ name, value }) => {
  const actualValue = parseInt(zIndexVars[name]);
  if (actualValue === value) {
    console.log(`✅ ${name}: ${actualValue} (correto)`);
  } else {
    console.log(`❌ ${name}: ${actualValue} (esperado: ${value})`);
    hierarchyCorrect = false;
  }
});

// ===== 2. VERIFICAR COMPONENTES PRESENTES =====
console.log('\n📋 2. VERIFICANDO COMPONENTES PRESENTES...');

const components = {
  'Mobile FABs': document.querySelector('app-mobile-fabs'),
  'Music Player': document.querySelector('app-music-player'),
  'Modal Mobile': document.querySelector('.mobile-modal-overlay'),
  'Modal Web': document.querySelector('.details-modal-overlay'),
  'Tab Bar': document.querySelector('ion-tab-bar'),
  'Header': document.querySelector('ion-header'),
  'Sidemenu': document.querySelector('ion-menu')
};

Object.entries(components).forEach(([name, element]) => {
  console.log(`${name}: ${element ? '✅ Encontrado' : '❌ Não encontrado'}`);
});

// ===== 3. VERIFICAR Z-INDEX DOS COMPONENTES =====
console.log('\n📋 3. VERIFICANDO Z-INDEX DOS COMPONENTES...');

const componentZIndexes = [];

// FABs
const mobileFabs = document.querySelector('app-mobile-fabs');
if (mobileFabs) {
  const fabElements = mobileFabs.querySelectorAll('ion-fab, ion-fab-button');
  fabElements.forEach((fab, index) => {
    const zIndex = parseInt(window.getComputedStyle(fab).zIndex);
    componentZIndexes.push({ name: `FAB ${index + 1}`, zIndex, element: fab });
  });
}

// Music Player
const musicPlayer = document.querySelector('.music-player');
if (musicPlayer) {
  const zIndex = parseInt(window.getComputedStyle(musicPlayer).zIndex);
  componentZIndexes.push({ name: 'Music Player', zIndex, element: musicPlayer });
}

// Modais
const modals = document.querySelectorAll('.mobile-modal-overlay, .details-modal-overlay');
modals.forEach((modal, index) => {
  const zIndex = parseInt(window.getComputedStyle(modal).zIndex);
  componentZIndexes.push({ name: `Modal ${index + 1}`, zIndex, element: modal });
});

// Tab Bar
const tabBar = document.querySelector('ion-tab-bar');
if (tabBar) {
  const zIndex = parseInt(window.getComputedStyle(tabBar).zIndex);
  componentZIndexes.push({ name: 'Tab Bar', zIndex, element: tabBar });
}

// Headers
const headers = document.querySelectorAll('ion-header');
headers.forEach((header, index) => {
  const zIndex = parseInt(window.getComputedStyle(header).zIndex);
  componentZIndexes.push({ name: `Header ${index + 1}`, zIndex, element: header });
});

// Ordenar por z-index (maior para menor)
componentZIndexes.sort((a, b) => b.zIndex - a.zIndex);

console.log('Z-Index dos componentes (ordenado do maior para o menor):');
componentZIndexes.forEach(({ name, zIndex }) => {
  console.log(`${zIndex}: ${name}`);
});

// ===== 4. VALIDAR HIERARQUIA ESPECÍFICA =====
console.log('\n📋 4. VALIDANDO HIERARQUIA ESPECÍFICA...');

const modal = document.querySelector('.mobile-modal-overlay, .details-modal-overlay');
if (modal) {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  console.log(`🎯 Modal Z-Index: ${modalZIndex}`);
  
  let hierarchyIssues = [];
  
  // Verificar se FABs estão abaixo do modal
  if (mobileFabs) {
    const fabElements = mobileFabs.querySelectorAll('ion-fab, ion-fab-button');
    fabElements.forEach((fab, index) => {
      const fabZIndex = parseInt(window.getComputedStyle(fab).zIndex);
      if (fabZIndex >= modalZIndex) {
        hierarchyIssues.push(`FAB ${index + 1} (${fabZIndex}) está sobrepondo modal`);
      }
    });
  }
  
  // Verificar se Music Player está abaixo do modal
  if (musicPlayer) {
    const playerZIndex = parseInt(window.getComputedStyle(musicPlayer).zIndex);
    if (playerZIndex >= modalZIndex) {
      hierarchyIssues.push(`Music Player (${playerZIndex}) está sobrepondo modal`);
    }
  }
  
  // Verificar se Tab Bar está abaixo do modal
  if (tabBar) {
    const tabBarZIndex = parseInt(window.getComputedStyle(tabBar).zIndex);
    if (tabBarZIndex >= modalZIndex) {
      hierarchyIssues.push(`Tab Bar (${tabBarZIndex}) está sobrepondo modal`);
    }
  }
  
  if (hierarchyIssues.length === 0) {
    console.log('🎉 HIERARQUIA PERFEITA! Todos os elementos estão abaixo do modal');
  } else {
    console.log('⚠️ PROBLEMAS DE HIERARQUIA DETECTADOS:');
    hierarchyIssues.forEach(issue => console.log(`❌ ${issue}`));
  }
} else {
  console.log('⚠️ Nenhum modal encontrado - abra um modal para testar hierarquia');
}

// ===== 5. VERIFICAR OBSERVERS E ESTADOS =====
console.log('\n📋 5. VERIFICANDO OBSERVERS E ESTADOS...');

// Verificar se FABs estão escondidos quando modal presente
if (modal && mobileFabs) {
  const fabsContainer = mobileFabs.querySelector('.mobile-fabs-container');
  if (fabsContainer) {
    const containerDisplay = window.getComputedStyle(fabsContainer).display;
    if (containerDisplay === 'none') {
      console.log('✅ FABs estão sendo escondidos corretamente quando modal presente');
    } else {
      console.log('⚠️ FABs não estão sendo escondidos quando modal presente');
    }
  }
}

// Verificar se Music Player tem classe modal-open
if (modal && musicPlayer) {
  const hasModalOpenClass = musicPlayer.classList.contains('modal-open');
  if (hasModalOpenClass) {
    console.log('✅ Music Player tem classe modal-open aplicada');
  } else {
    console.log('⚠️ Music Player não tem classe modal-open aplicada');
  }
}

// ===== 6. BUSCAR ELEMENTOS PROBLEMÁTICOS =====
console.log('\n📋 6. BUSCANDO ELEMENTOS PROBLEMÁTICOS...');

const allElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const zIndex = parseInt(window.getComputedStyle(el).zIndex);
  return zIndex > 50000 || zIndex === 2147483647;
});

if (allElements.length > 0) {
  console.log('🚨 ELEMENTOS COM Z-INDEX EXTREMAMENTE ALTO ENCONTRADOS:');
  allElements.forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    console.log(`${zIndex}: ${el.tagName}.${el.className}`);
  });
} else {
  console.log('✅ Nenhum elemento com z-index problemático encontrado');
}

// ===== 7. APLICAR CORREÇÕES DE EMERGÊNCIA =====
console.log('\n🛠️ 7. APLICANDO CORREÇÕES DE EMERGÊNCIA SE NECESSÁRIO...');

let correctionsApplied = 0;

// Corrigir elementos com z-index extremamente alto
allElements.forEach(el => {
  el.style.zIndex = '100';
  correctionsApplied++;
});

// Forçar modal para z-index muito alto se presente
if (modal) {
  modal.style.zIndex = '999999';
  console.log('✅ Modal z-index forçado para 999999');
  correctionsApplied++;
}

// Forçar FABs para z-index baixo se modal presente
if (modal && mobileFabs) {
  const fabElements = mobileFabs.querySelectorAll('ion-fab, ion-fab-button');
  fabElements.forEach(fab => {
    fab.style.zIndex = '100';
  });
  if (fabElements.length > 0) {
    console.log(`✅ ${fabElements.length} FABs z-index forçado para 100`);
    correctionsApplied++;
  }
}

// Forçar Music Player para z-index baixo se modal presente
if (modal && musicPlayer) {
  musicPlayer.style.zIndex = '100';
  musicPlayer.classList.add('modal-open');
  console.log('✅ Music Player z-index forçado para 100');
  correctionsApplied++;
}

if (correctionsApplied === 0) {
  console.log('✅ Nenhuma correção de emergência necessária');
} else {
  console.log(`🔧 ${correctionsApplied} correções de emergência aplicadas`);
}

// ===== 8. RESUMO FINAL =====
console.log('\n📊 RESUMO FINAL DO TESTE COMPLETO:');
console.log('='.repeat(60));

const finalResults = {
  variablesCorrect: hierarchyCorrect,
  componentsFound: Object.values(components).filter(Boolean).length,
  totalComponents: Object.keys(components).length,
  modalPresent: !!modal,
  hierarchyIssues: modal ? (hierarchyIssues?.length || 0) : 0,
  problematicElements: allElements.length,
  correctionsApplied
};

console.log(`✅ Variáveis CSS corretas: ${finalResults.variablesCorrect ? 'Sim' : 'Não'}`);
console.log(`✅ Componentes encontrados: ${finalResults.componentsFound}/${finalResults.totalComponents}`);
console.log(`✅ Modal presente: ${finalResults.modalPresent ? 'Sim' : 'Não'}`);
console.log(`✅ Problemas de hierarquia: ${finalResults.hierarchyIssues}`);
console.log(`✅ Elementos problemáticos: ${finalResults.problematicElements}`);
console.log(`✅ Correções aplicadas: ${finalResults.correctionsApplied}`);

const allTestsPassed = finalResults.variablesCorrect && 
                      finalResults.hierarchyIssues === 0 && 
                      finalResults.problematicElements === 0;

if (allTestsPassed) {
  console.log('\n🎉 TODOS OS TESTES DE Z-INDEX PASSARAM!');
  console.log('🚀 Sistema de z-index funcionando perfeitamente!');
} else {
  console.log('\n⚠️ ALGUNS PROBLEMAS DETECTADOS, MAS CORREÇÕES APLICADAS');
  console.log('💡 Recarregue a página e execute novamente para validar');
}

console.log('\n🔧 TESTE COMPLETO DE Z-INDEX CONCLUÍDO!');
console.log('📝 Use este script sempre que suspeitar de problemas de z-index');
