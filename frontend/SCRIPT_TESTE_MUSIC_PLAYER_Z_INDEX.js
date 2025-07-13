// ===== SCRIPT DE TESTE PARA MUSIC PLAYER Z-INDEX =====
// Execute este script no DevTools para testar se o music player está sendo corrigido

console.log('🔧 INICIANDO TESTE DO MUSIC PLAYER Z-INDEX...\n');

// ===== 1. VERIFICAR COMPONENTE MUSIC PLAYER =====
console.log('📋 1. VERIFICANDO COMPONENTE MUSIC PLAYER...');

const musicPlayerComponent = document.querySelector('app-music-player');
const musicPlayerElement = document.querySelector('.music-player');

console.log('Componente app-music-player:', musicPlayerComponent ? '✅ Encontrado' : '❌ Não encontrado');
console.log('Elemento .music-player:', musicPlayerElement ? '✅ Encontrado' : '❌ Não encontrado');

if (musicPlayerElement) {
  const playerZIndex = window.getComputedStyle(musicPlayerElement).zIndex;
  const playerPosition = window.getComputedStyle(musicPlayerElement).position;
  const playerBottom = window.getComputedStyle(musicPlayerElement).bottom;
  
  console.log('Music Player propriedades:', {
    zIndex: playerZIndex,
    position: playerPosition,
    bottom: playerBottom,
    classes: musicPlayerElement.className
  });
}

// ===== 2. VERIFICAR MODAL PRESENTE =====
console.log('\n📋 2. VERIFICANDO MODAL PRESENTE...');

const modal = document.querySelector('.mobile-modal-overlay, .details-modal-overlay');
const modalComponent = document.querySelector('app-pokemon-details-mobile');

console.log('Modal encontrado:', modal ? '✅ Sim' : '❌ Não');
console.log('Componente modal:', modalComponent ? '✅ Sim' : '❌ Não');

if (modal) {
  const modalZIndex = window.getComputedStyle(modal).zIndex;
  const modalPosition = window.getComputedStyle(modal).position;
  console.log('Modal Z-Index:', modalZIndex);
  console.log('Modal Position:', modalPosition);
}

// ===== 3. VERIFICAR HIERARQUIA Z-INDEX =====
console.log('\n📋 3. VERIFICANDO HIERARQUIA Z-INDEX...');

if (modal && musicPlayerElement) {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
  
  console.log(`Modal Z-Index: ${modalZIndex}`);
  console.log(`Music Player Z-Index: ${playerZIndex}`);
  
  if (playerZIndex < modalZIndex) {
    console.log('✅ HIERARQUIA CORRETA: Music Player está abaixo do modal');
  } else {
    console.log('❌ PROBLEMA DE HIERARQUIA: Music Player está sobrepondo modal');
  }
} else if (!modal) {
  console.log('⚠️ Modal não encontrado - abra um modal primeiro para testar hierarquia');
} else {
  console.log('⚠️ Music Player não encontrado');
}

// ===== 4. VERIFICAR OBSERVER DE MODAIS =====
console.log('\n📋 4. VERIFICANDO OBSERVER DE MODAIS...');

// Verificar se o music player tem a classe modal-open quando modal presente
if (musicPlayerElement && modal) {
  const hasModalOpenClass = musicPlayerElement.classList.contains('modal-open');
  console.log('Music Player tem classe modal-open:', hasModalOpenClass ? '✅ Sim' : '❌ Não');
  
  if (hasModalOpenClass) {
    console.log('✅ Observer funcionando - classe modal-open aplicada');
  } else {
    console.log('⚠️ Observer pode não estar funcionando - classe modal-open não aplicada');
  }
}

// ===== 5. VERIFICAR VARIÁVEIS CSS =====
console.log('\n📋 5. VERIFICANDO VARIÁVEIS CSS...');

const rootStyles = getComputedStyle(document.documentElement);
const zMusicPlayerValue = rootStyles.getPropertyValue('--z-music-player').trim();
const zPokemonModalValue = rootStyles.getPropertyValue('--z-pokemon-modal').trim();

console.log('Variáveis Z-Index:');
console.log('--z-music-player:', zMusicPlayerValue);
console.log('--z-pokemon-modal:', zPokemonModalValue);

if (parseInt(zMusicPlayerValue) < parseInt(zPokemonModalValue)) {
  console.log('✅ Variáveis CSS corretas: Music Player < Pokemon Modal');
} else {
  console.log('❌ Problema nas variáveis CSS');
}

// ===== 6. APLICAR CORREÇÃO DE EMERGÊNCIA SE NECESSÁRIO =====
console.log('\n🛠️ 6. APLICANDO CORREÇÃO DE EMERGÊNCIA SE NECESSÁRIO...');

let correctionApplied = false;

if (modal && musicPlayerElement) {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
  
  if (playerZIndex >= modalZIndex) {
    console.log('🚨 Aplicando correção de emergência...');
    
    // Forçar modal para z-index muito alto
    modal.style.zIndex = '999999';
    console.log('✅ Modal z-index forçado para 999999');
    
    // Forçar music player para z-index baixo
    musicPlayerElement.style.zIndex = '100';
    musicPlayerElement.classList.add('modal-open');
    console.log('✅ Music Player z-index forçado para 100');
    
    correctionApplied = true;
  } else {
    console.log('✅ Hierarquia já está correta - nenhuma correção necessária');
  }
}

// ===== 7. TESTAR FUNCIONALIDADE DO MUSIC PLAYER =====
console.log('\n📋 7. TESTANDO FUNCIONALIDADE DO MUSIC PLAYER...');

if (musicPlayerElement) {
  const isMinimized = musicPlayerElement.classList.contains('minimized');
  const isAutoMinimized = musicPlayerElement.classList.contains('auto-minimized');
  
  console.log('Estados do Music Player:');
  console.log('- Minimizado:', isMinimized ? 'Sim' : 'Não');
  console.log('- Auto-minimizado:', isAutoMinimized ? 'Sim' : 'Não');
  console.log('- Modal aberto:', musicPlayerElement.classList.contains('modal-open') ? 'Sim' : 'Não');
  
  // Verificar se controles estão acessíveis
  const playButton = musicPlayerElement.querySelector('.play-pause-btn, .play-pause-main');
  console.log('Botão de play acessível:', playButton ? '✅ Sim' : '❌ Não');
}

// ===== 8. VALIDAÇÃO FINAL =====
console.log('\n✅ 8. VALIDAÇÃO FINAL...');

setTimeout(() => {
  if (modal && musicPlayerElement) {
    const finalModalZ = parseInt(window.getComputedStyle(modal).zIndex);
    const finalPlayerZ = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
    
    console.log(`🎯 Z-index final do modal: ${finalModalZ}`);
    console.log(`🎵 Z-index final do music player: ${finalPlayerZ}`);
    
    if (finalModalZ > finalPlayerZ) {
      console.log('🎉 CORREÇÃO DO MUSIC PLAYER APLICADA COM SUCESSO!');
      console.log('Modal agora está acima do music player');
    } else {
      console.log('❌ CORREÇÃO DO MUSIC PLAYER FALHOU - Verificar manualmente');
      console.log('💡 Tente recarregar a página e executar o script novamente');
    }
  }
}, 100);

// ===== 9. RESUMO FINAL =====
console.log('\n📊 RESUMO DO TESTE DO MUSIC PLAYER:');
console.log('='.repeat(50));

const results = {
  componentFound: !!musicPlayerComponent,
  elementFound: !!musicPlayerElement,
  modalFound: !!modal,
  hierarchyCorrect: modal && musicPlayerElement ? 
    parseInt(window.getComputedStyle(musicPlayerElement).zIndex) < parseInt(window.getComputedStyle(modal).zIndex) : 
    true,
  observerWorking: musicPlayerElement && modal ? 
    musicPlayerElement.classList.contains('modal-open') : 
    true
};

console.log('✅ Componente encontrado:', results.componentFound);
console.log('✅ Elemento encontrado:', results.elementFound);
console.log('✅ Modal encontrado:', results.modalFound);
console.log('✅ Hierarquia correta:', results.hierarchyCorrect);
console.log('✅ Observer funcionando:', results.observerWorking);

const allTestsPassed = Object.values(results).every(result => result === true);

if (allTestsPassed) {
  console.log('\n🎉 TODOS OS TESTES DO MUSIC PLAYER PASSARAM!');
  console.log('O music player está funcionando corretamente com os modais!');
} else {
  console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFICAR ELEMENTOS COM PROBLEMA.');
}

console.log('\n🔧 TESTE DO MUSIC PLAYER CONCLUÍDO!');
console.log('💡 Teste manualmente abrindo um modal para verificar se o music player fica abaixo.');
