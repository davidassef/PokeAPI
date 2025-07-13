// ===== SCRIPT DE TESTE FINAL - TODAS AS CORREÇÕES =====
// Execute este script no DevTools para validar TODAS as correções implementadas

console.log('🔧 INICIANDO TESTE FINAL DE TODAS AS CORREÇÕES...\n');
console.log('Este script valida: Music Player, FABs removidos, Modal Auth, e Z-Index geral\n');

// ===== 1. VERIFICAR MUSIC PLAYER CORRIGIDO =====
console.log('📋 1. VERIFICANDO MUSIC PLAYER CORRIGIDO...');

const musicPlayerElement = document.querySelector('.music-player');
const musicPlayerComponent = document.querySelector('app-music-player');

console.log('Componente app-music-player:', musicPlayerComponent ? '✅ Encontrado' : '❌ Não encontrado');
console.log('Elemento .music-player:', musicPlayerElement ? '✅ Encontrado' : '❌ Não encontrado');

if (musicPlayerElement) {
  const styles = window.getComputedStyle(musicPlayerElement);
  const position = styles.position;
  const bottom = styles.bottom;
  const zIndex = styles.zIndex;
  
  console.log('Music Player propriedades:');
  console.log(`- Position: ${position} ${position === 'fixed' ? '✅' : '❌ (esperado: fixed)'}`);
  console.log(`- Bottom: ${bottom} ${bottom === '80px' ? '✅' : '❌ (esperado: 80px)'}`);
  console.log(`- Z-Index: ${zIndex}`);
  
  // Verificar se está na posição correta (canto inferior)
  const rect = musicPlayerElement.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const isAtBottom = rect.bottom >= (windowHeight - 100);
  
  console.log(`- Posição: ${isAtBottom ? '✅ Canto inferior' : '❌ Não está no canto inferior'}`);
}

// ===== 2. VERIFICAR FABS REMOVIDOS =====
console.log('\n📋 2. VERIFICANDO FABS REMOVIDOS...');

const mobileFabsComponent = document.querySelector('app-mobile-fabs');
const fabElements = document.querySelectorAll('ion-fab');
const fabButtons = document.querySelectorAll('ion-fab-button');

console.log('Componente app-mobile-fabs:', mobileFabsComponent ? '❌ Ainda presente (deveria estar removido)' : '✅ Removido');
console.log(`Elementos ion-fab encontrados: ${fabElements.length}`);
console.log(`Elementos ion-fab-button encontrados: ${fabButtons.length}`);

if (fabElements.length === 0 && fabButtons.length === 0) {
  console.log('✅ FABs completamente removidos');
} else {
  console.log('⚠️ Ainda existem FABs na página');
  fabElements.forEach((fab, index) => {
    console.log(`FAB ${index + 1}:`, fab.className);
  });
}

// ===== 3. VERIFICAR MODAL DE AUTENTICAÇÃO =====
console.log('\n📋 3. VERIFICANDO MODAL DE AUTENTICAÇÃO...');

const authModal = document.querySelector('app-auth-modal-new');
const authModalContainer = document.querySelector('.auth-modal-container');

console.log('Modal auth component:', authModal ? '✅ Encontrado' : '❌ Não encontrado');
console.log('Modal auth container:', authModalContainer ? '✅ Encontrado' : '❌ Não encontrado');

if (authModal || authModalContainer) {
  const modalElement = authModal || authModalContainer;
  const modalZIndex = parseInt(window.getComputedStyle(modalElement).zIndex);
  
  console.log(`Modal Auth Z-Index: ${modalZIndex}`);
  
  // Verificar se music player está abaixo quando modal auth presente
  if (musicPlayerElement) {
    const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
    const hasModalOpenClass = musicPlayerElement.classList.contains('modal-open');
    
    console.log(`Music Player Z-Index: ${playerZIndex}`);
    console.log('Music Player classe modal-open:', hasModalOpenClass ? '✅ Aplicada' : '❌ Não aplicada');
    
    if (playerZIndex < modalZIndex || hasModalOpenClass) {
      console.log('✅ Music Player corretamente abaixo do modal auth');
    } else {
      console.log('❌ Music Player pode estar sobrepondo modal auth');
    }
  }
}

// ===== 4. VERIFICAR OBSERVER DO MUSIC PLAYER =====
console.log('\n📋 4. VERIFICANDO OBSERVER DO MUSIC PLAYER...');

// Simular abertura de modal para testar observer
console.log('Testando observer do music player...');

// Verificar se há modais presentes
const allModals = document.querySelectorAll('.mobile-modal-overlay, .details-modal-overlay, .auth-modal-container, app-auth-modal-new');
console.log(`Modais encontrados: ${allModals.length}`);

if (allModals.length > 0 && musicPlayerElement) {
  const inlineZIndex = musicPlayerElement.style.zIndex;
  const hasModalOpenClass = musicPlayerElement.classList.contains('modal-open');
  
  console.log('Z-index inline do music player:', inlineZIndex || 'Nenhum');
  console.log('Classe modal-open:', hasModalOpenClass ? '✅ Aplicada' : '❌ Não aplicada');
  
  if (inlineZIndex === '100' || hasModalOpenClass) {
    console.log('✅ Observer funcionando - Music Player ajustado para modal');
  } else {
    console.log('⚠️ Observer pode não estar funcionando');
  }
}

// ===== 5. VERIFICAR HIERARQUIA Z-INDEX GERAL =====
console.log('\n📋 5. VERIFICANDO HIERARQUIA Z-INDEX GERAL...');

const rootStyles = getComputedStyle(document.documentElement);
const zIndexVars = {
  'auth-modal': rootStyles.getPropertyValue('--z-auth-modal').trim(),
  'sidemenu': rootStyles.getPropertyValue('--z-sidemenu').trim(),
  'pokemon-modal': rootStyles.getPropertyValue('--z-pokemon-modal').trim(),
  'music-player': rootStyles.getPropertyValue('--z-music-player').trim(),
  'fab': rootStyles.getPropertyValue('--z-fab').trim(),
  'header': rootStyles.getPropertyValue('--z-header').trim()
};

console.log('Variáveis Z-Index CSS:');
Object.entries(zIndexVars).forEach(([name, value]) => {
  console.log(`--z-${name}: ${value}`);
});

// Verificar hierarquia esperada
const expectedOrder = [
  { name: 'auth-modal', value: 10000 },
  { name: 'sidemenu', value: 9000 },
  { name: 'pokemon-modal', value: 8000 },
  { name: 'music-player', value: 7000 },
  { name: 'fab', value: 6000 },
  { name: 'header', value: 5000 }
];

let hierarchyCorrect = true;
expectedOrder.forEach(({ name, value }) => {
  const actualValue = parseInt(zIndexVars[name]);
  if (actualValue === value) {
    console.log(`✅ ${name}: ${actualValue} (correto)`);
  } else {
    console.log(`❌ ${name}: ${actualValue} (esperado: ${value})`);
    hierarchyCorrect = false;
  }
});

// ===== 6. VERIFICAR PROTEÇÕES CSS GLOBAIS =====
console.log('\n📋 6. VERIFICANDO PROTEÇÕES CSS GLOBAIS...');

// Verificar se as regras CSS de proteção estão aplicadas
const testElement = document.createElement('div');
testElement.className = 'test-z-index';
testElement.style.position = 'fixed';
testElement.style.zIndex = '999999';
testElement.style.visibility = 'hidden';
document.body.appendChild(testElement);

const testZIndex = parseInt(window.getComputedStyle(testElement).zIndex);
console.log(`Teste de z-index alto: ${testZIndex}`);

document.body.removeChild(testElement);

// ===== 7. APLICAR CORREÇÕES DE EMERGÊNCIA =====
console.log('\n🛠️ 7. APLICANDO CORREÇÕES DE EMERGÊNCIA SE NECESSÁRIO...');

let correctionsApplied = 0;

// Corrigir music player se necessário
if (musicPlayerElement) {
  const styles = window.getComputedStyle(musicPlayerElement);
  if (styles.position !== 'fixed' || styles.bottom !== '80px') {
    console.log('🚨 Corrigindo posicionamento do music player...');
    musicPlayerElement.style.position = 'fixed';
    musicPlayerElement.style.bottom = '80px';
    musicPlayerElement.style.left = '16px';
    musicPlayerElement.style.right = '16px';
    correctionsApplied++;
  }
}

// Garantir hierarquia de modais
allModals.forEach((modal, index) => {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  if (modalZIndex < 8000) {
    console.log(`🚨 Corrigindo z-index do modal ${index + 1}...`);
    modal.style.zIndex = '999999';
    correctionsApplied++;
  }
});

// Forçar music player abaixo de modais se necessário
if (allModals.length > 0 && musicPlayerElement) {
  const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
  if (playerZIndex >= 8000) {
    console.log('🚨 Forçando music player abaixo dos modais...');
    musicPlayerElement.style.zIndex = '100';
    musicPlayerElement.classList.add('modal-open');
    correctionsApplied++;
  }
}

if (correctionsApplied === 0) {
  console.log('✅ Nenhuma correção de emergência necessária');
} else {
  console.log(`🔧 ${correctionsApplied} correções de emergência aplicadas`);
}

// ===== 8. RESUMO FINAL =====
console.log('\n📊 RESUMO FINAL DE TODAS AS CORREÇÕES:');
console.log('='.repeat(70));

const finalResults = {
  musicPlayerFixed: musicPlayerElement && window.getComputedStyle(musicPlayerElement).position === 'fixed',
  fabsRemoved: fabElements.length === 0 && fabButtons.length === 0,
  authModalDetected: !!(authModal || authModalContainer),
  hierarchyCorrect: hierarchyCorrect,
  observerWorking: allModals.length === 0 || (musicPlayerElement && (musicPlayerElement.style.zIndex === '100' || musicPlayerElement.classList.contains('modal-open'))),
  correctionsApplied: correctionsApplied
};

console.log('✅ Music Player corrigido:', finalResults.musicPlayerFixed);
console.log('✅ FABs removidos:', finalResults.fabsRemoved);
console.log('✅ Modal Auth detectado:', finalResults.authModalDetected);
console.log('✅ Hierarquia Z-Index correta:', finalResults.hierarchyCorrect);
console.log('✅ Observer funcionando:', finalResults.observerWorking);
console.log('✅ Correções aplicadas:', finalResults.correctionsApplied);

const allTestsPassed = Object.values(finalResults).every(result => result === true || result === 0);

if (allTestsPassed) {
  console.log('\n🎉 TODAS AS CORREÇÕES VALIDADAS COM SUCESSO!');
  console.log('🚀 Sistema funcionando perfeitamente!');
  console.log('📍 Music Player: Fixo no canto inferior');
  console.log('🗑️ FABs: Completamente removidos');
  console.log('🔐 Modal Auth: Detectado e funcionando');
  console.log('🎯 Z-Index: Hierarquia correta');
  console.log('👁️ Observer: Funcionando corretamente');
} else {
  console.log('\n⚠️ ALGUMAS CORREÇÕES PRECISAM DE ATENÇÃO');
  console.log('💡 Verifique os itens marcados com ❌ acima');
}

console.log('\n🔧 TESTE FINAL CONCLUÍDO!');
console.log('💡 Execute este script sempre que quiser validar o sistema');
console.log('💡 Abra modais para testar a hierarquia z-index em tempo real');
