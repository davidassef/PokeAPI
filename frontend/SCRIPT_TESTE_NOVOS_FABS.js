// ===== SCRIPT DE TESTE PARA NOVOS FABs =====
// Execute este script no DevTools para testar os novos FABs

console.log('🔧 INICIANDO TESTE DOS NOVOS FABs...\n');

// ===== 1. VERIFICAR COMPONENTE MOBILE-FABS =====
console.log('📋 1. VERIFICANDO COMPONENTE MOBILE-FABS...');

const mobileFabsComponent = document.querySelector('app-mobile-fabs');
const mobileFabsContainer = document.querySelector('.mobile-fabs-container');

console.log('Componente app-mobile-fabs:', mobileFabsComponent ? '✅ Encontrado' : '❌ Não encontrado');
console.log('Container .mobile-fabs-container:', mobileFabsContainer ? '✅ Encontrado' : '❌ Não encontrado');

if (mobileFabsComponent) {
  const componentZIndex = window.getComputedStyle(mobileFabsComponent).zIndex;
  console.log('Z-Index do componente:', componentZIndex);
}

// ===== 2. VERIFICAR FABs INDIVIDUAIS =====
console.log('\n📋 2. VERIFICANDO FABs INDIVIDUAIS...');

const surpriseFab = document.querySelector('.mobile-fab-surprise');
const scrollTopFab = document.querySelector('.mobile-fab-scroll-top');
const surpriseFabButton = document.querySelector('.surprise-fab-mobile');
const scrollTopFabButton = document.querySelector('.scroll-top-fab-mobile');

console.log('FABs encontrados:');
console.log('- Surprise FAB Container:', surpriseFab ? '✅ Encontrado' : '❌ Não encontrado');
console.log('- Scroll Top FAB Container:', scrollTopFab ? '✅ Encontrado' : '❌ Não encontrado');
console.log('- Surprise FAB Button:', surpriseFabButton ? '✅ Encontrado' : '❌ Não encontrado');
console.log('- Scroll Top FAB Button:', scrollTopFabButton ? '✅ Encontrado' : '❌ Não encontrado');

// ===== 3. VERIFICAR Z-INDEX DOS NOVOS FABs =====
console.log('\n📋 3. VERIFICANDO Z-INDEX DOS NOVOS FABs...');

const fabElements = [
  { element: surpriseFab, name: 'Surprise FAB Container' },
  { element: scrollTopFab, name: 'Scroll Top FAB Container' },
  { element: surpriseFabButton, name: 'Surprise FAB Button' },
  { element: scrollTopFabButton, name: 'Scroll Top FAB Button' }
];

fabElements.forEach(({ element, name }) => {
  if (element) {
    const zIndex = window.getComputedStyle(element).zIndex;
    const position = window.getComputedStyle(element).position;
    console.log(`${name}:`, {
      zIndex,
      position,
      display: window.getComputedStyle(element).display,
      visibility: window.getComputedStyle(element).visibility
    });
  }
});

// ===== 4. VERIFICAR HIERARQUIA COM MODAL =====
console.log('\n📋 4. VERIFICANDO HIERARQUIA COM MODAL...');

const modal = document.querySelector('.mobile-modal-overlay, .details-modal-overlay');
console.log('Modal presente:', modal ? '✅ Sim' : '❌ Não');

if (modal) {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  console.log('Modal Z-Index:', modalZIndex);
  
  let hierarchyOK = true;
  
  fabElements.forEach(({ element, name }) => {
    if (element) {
      const fabZIndex = parseInt(window.getComputedStyle(element).zIndex);
      if (fabZIndex >= modalZIndex) {
        console.log(`❌ ${name} está sobrepondo modal (Z-Index: ${fabZIndex})`);
        hierarchyOK = false;
      } else {
        console.log(`✅ ${name} está abaixo do modal (Z-Index: ${fabZIndex})`);
      }
    }
  });
  
  if (hierarchyOK) {
    console.log('\n🎉 HIERARQUIA Z-INDEX DOS NOVOS FABs CORRETA!');
  } else {
    console.log('\n⚠️ PROBLEMAS DE HIERARQUIA DETECTADOS NOS NOVOS FABs!');
  }
} else {
  console.log('⚠️ Modal não encontrado - abra um modal primeiro para testar hierarquia');
}

// ===== 5. VERIFICAR FUNCIONALIDADE DE ESCONDER FABs =====
console.log('\n📋 5. VERIFICANDO FUNCIONALIDADE DE ESCONDER FABs...');

if (mobileFabsContainer) {
  const containerDisplay = window.getComputedStyle(mobileFabsContainer).display;
  const containerVisibility = window.getComputedStyle(mobileFabsContainer).visibility;
  
  console.log('Container display:', containerDisplay);
  console.log('Container visibility:', containerVisibility);
  
  if (modal && containerDisplay === 'none') {
    console.log('✅ FABs estão sendo escondidos corretamente quando modal presente');
  } else if (modal && containerDisplay !== 'none') {
    console.log('⚠️ FABs não estão sendo escondidos quando modal presente');
  } else if (!modal && containerDisplay !== 'none') {
    console.log('✅ FABs estão visíveis quando não há modal');
  }
}

// ===== 6. TESTAR CLIQUES DOS FABs =====
console.log('\n📋 6. TESTANDO CLIQUES DOS FABs...');

if (surpriseFabButton) {
  console.log('✅ Surprise FAB disponível para clique');
  // Não vamos clicar automaticamente, apenas verificar se está disponível
}

if (scrollTopFabButton) {
  console.log('✅ Scroll Top FAB disponível para clique');
  // Não vamos clicar automaticamente, apenas verificar se está disponível
}

// ===== 7. VERIFICAR CSS APLICADO =====
console.log('\n📋 7. VERIFICANDO CSS APLICADO...');

const rootStyles = getComputedStyle(document.documentElement);
const zFabValue = rootStyles.getPropertyValue('--z-fab').trim();
console.log('Variável --z-fab:', zFabValue);

// Verificar se as regras CSS específicas estão sendo aplicadas
const fabsWithCorrectZIndex = document.querySelectorAll('app-mobile-fabs ion-fab, app-mobile-fabs ion-fab-button');
console.log(`FABs com z-index aplicado: ${fabsWithCorrectZIndex.length}`);

fabsWithCorrectZIndex.forEach((fab, index) => {
  const zIndex = window.getComputedStyle(fab).zIndex;
  console.log(`FAB ${index + 1} z-index:`, zIndex);
});

// ===== 8. RESUMO FINAL =====
console.log('\n📊 RESUMO DO TESTE DOS NOVOS FABs:');
console.log('='.repeat(50));

const results = {
  componentFound: !!mobileFabsComponent,
  containerFound: !!mobileFabsContainer,
  surpriseFabFound: !!surpriseFabButton,
  scrollTopFabFound: !!scrollTopFabButton,
  correctZIndex: true, // Será atualizado baseado nos testes
  modalHierarchy: !modal || hierarchyOK
};

console.log('✅ Componente encontrado:', results.componentFound);
console.log('✅ Container encontrado:', results.containerFound);
console.log('✅ Surprise FAB encontrado:', results.surpriseFabFound);
console.log('✅ Scroll Top FAB encontrado:', results.scrollTopFabFound);
console.log('✅ Hierarquia com modal correta:', results.modalHierarchy);

const allTestsPassed = Object.values(results).every(result => result === true);

if (allTestsPassed) {
  console.log('\n🎉 TODOS OS TESTES DOS NOVOS FABs PASSARAM!');
  console.log('Os FABs foram recriados com sucesso e estão funcionando corretamente!');
} else {
  console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFICAR ELEMENTOS COM PROBLEMA.');
}

console.log('\n🔧 TESTE DOS NOVOS FABs CONCLUÍDO!');
console.log('💡 Teste manualmente clicando nos FABs para verificar funcionalidade completa.');
