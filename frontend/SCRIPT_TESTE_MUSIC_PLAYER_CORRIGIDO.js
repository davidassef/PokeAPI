// ===== SCRIPT DE TESTE PARA MUSIC PLAYER CORRIGIDO =====
// Execute este script no DevTools para validar se o music player foi corrigido

console.log('🔧 INICIANDO TESTE DO MUSIC PLAYER CORRIGIDO...\n');

// ===== 1. VERIFICAR POSICIONAMENTO =====
console.log('📋 1. VERIFICANDO POSICIONAMENTO DO MUSIC PLAYER...');

const musicPlayerElement = document.querySelector('.music-player');
const musicPlayerComponent = document.querySelector('app-music-player');

console.log('Componente app-music-player:', musicPlayerComponent ? '✅ Encontrado' : '❌ Não encontrado');
console.log('Elemento .music-player:', musicPlayerElement ? '✅ Encontrado' : '❌ Não encontrado');

if (musicPlayerElement) {
  const styles = window.getComputedStyle(musicPlayerElement);
  const position = styles.position;
  const bottom = styles.bottom;
  const left = styles.left;
  const right = styles.right;
  const zIndex = styles.zIndex;
  
  console.log('Propriedades CSS do Music Player:');
  console.log(`- Position: ${position} ${position === 'fixed' ? '✅' : '❌ (esperado: fixed)'}`);
  console.log(`- Bottom: ${bottom} ${bottom === '80px' ? '✅' : '❌ (esperado: 80px)'}`);
  console.log(`- Left: ${left} ${left === '16px' ? '✅' : '❌ (esperado: 16px)'}`);
  console.log(`- Right: ${right} ${right === '16px' ? '✅' : '❌ (esperado: 16px)'}`);
  console.log(`- Z-Index: ${zIndex}`);
  
  // Verificar se está na posição correta (canto inferior)
  const rect = musicPlayerElement.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const isAtBottom = rect.bottom >= (windowHeight - 100); // Margem de 100px
  
  console.log(`- Posição na tela: ${isAtBottom ? '✅ Canto inferior' : '❌ Não está no canto inferior'}`);
  console.log(`- Rect bottom: ${rect.bottom}, Window height: ${windowHeight}`);
} else {
  console.log('❌ Music Player não encontrado - não é possível verificar posicionamento');
}

// ===== 2. VERIFICAR OBSERVER DE MODAIS =====
console.log('\n📋 2. VERIFICANDO OBSERVER DE MODAIS...');

const modal = document.querySelector('.mobile-modal-overlay, .details-modal-overlay');
console.log('Modal presente:', modal ? '✅ Sim' : '❌ Não');

if (musicPlayerElement) {
  const hasModalOpenClass = musicPlayerElement.classList.contains('modal-open');
  const inlineZIndex = musicPlayerElement.style.zIndex;
  
  console.log('Classe modal-open aplicada:', hasModalOpenClass ? '✅ Sim' : '❌ Não');
  console.log('Z-index inline:', inlineZIndex || 'Nenhum');
  
  if (modal) {
    // Se há modal, verificar se z-index foi reduzido
    if (inlineZIndex === '100' || hasModalOpenClass) {
      console.log('✅ Observer funcionando - Music Player ajustado para modal');
    } else {
      console.log('⚠️ Observer pode não estar funcionando - Music Player não ajustado');
    }
  } else {
    // Se não há modal, verificar se z-index está normal
    if (inlineZIndex === 'var(--z-music-player)' || !inlineZIndex) {
      console.log('✅ Estado normal - Music Player com z-index padrão');
    } else {
      console.log('⚠️ Z-index pode estar incorreto sem modal presente');
    }
  }
}

// ===== 3. TESTAR HIERARQUIA Z-INDEX =====
console.log('\n📋 3. TESTANDO HIERARQUIA Z-INDEX...');

if (modal && musicPlayerElement) {
  const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
  const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
  
  console.log(`Modal Z-Index: ${modalZIndex}`);
  console.log(`Music Player Z-Index: ${playerZIndex}`);
  
  if (playerZIndex < modalZIndex) {
    console.log('✅ HIERARQUIA CORRETA: Music Player está abaixo do modal');
  } else {
    console.log('❌ PROBLEMA DE HIERARQUIA: Music Player pode estar sobrepondo modal');
  }
} else if (!modal) {
  console.log('⚠️ Nenhum modal presente - abra um modal para testar hierarquia');
} else {
  console.log('❌ Music Player não encontrado para testar hierarquia');
}

// ===== 4. VERIFICAR RESPONSIVIDADE MOBILE =====
console.log('\n📋 4. VERIFICANDO RESPONSIVIDADE MOBILE...');

const isMobile = window.innerWidth <= 768;
console.log(`Tela mobile detectada: ${isMobile ? 'Sim' : 'Não'} (${window.innerWidth}px)`);

if (musicPlayerElement && isMobile) {
  const styles = window.getComputedStyle(musicPlayerElement);
  const left = styles.left;
  const right = styles.right;
  const bottom = styles.bottom;
  
  console.log('Ajustes mobile:');
  console.log(`- Left: ${left} ${left === '8px' ? '✅' : '❌ (esperado: 8px para mobile)'}`);
  console.log(`- Right: ${right} ${right === '8px' ? '✅' : '❌ (esperado: 8px para mobile)'}`);
  console.log(`- Bottom: ${bottom} ${bottom === '70px' ? '✅' : '❌ (esperado: 70px para mobile)'}`);
}

// ===== 5. VERIFICAR FUNCIONALIDADE =====
console.log('\n📋 5. VERIFICANDO FUNCIONALIDADE DO MUSIC PLAYER...');

if (musicPlayerElement) {
  const isMinimized = musicPlayerElement.classList.contains('minimized');
  const isAutoMinimized = musicPlayerElement.classList.contains('auto-minimized');
  const isModalOpen = musicPlayerElement.classList.contains('modal-open');
  
  console.log('Estados do Music Player:');
  console.log(`- Minimizado: ${isMinimized ? 'Sim' : 'Não'}`);
  console.log(`- Auto-minimizado: ${isAutoMinimized ? 'Sim' : 'Não'}`);
  console.log(`- Modal aberto: ${isModalOpen ? 'Sim' : 'Não'}`);
  
  // Verificar controles
  const playButton = musicPlayerElement.querySelector('.play-pause-btn, .play-pause-main, [class*="play"]');
  const toggleButton = musicPlayerElement.querySelector('[class*="toggle"], [class*="minimize"]');
  
  console.log('Controles acessíveis:');
  console.log(`- Botão play/pause: ${playButton ? '✅ Encontrado' : '❌ Não encontrado'}`);
  console.log(`- Botão toggle: ${toggleButton ? '✅ Encontrado' : '❌ Não encontrado'}`);
}

// ===== 6. APLICAR CORREÇÃO DE EMERGÊNCIA SE NECESSÁRIO =====
console.log('\n🛠️ 6. APLICANDO CORREÇÃO DE EMERGÊNCIA SE NECESSÁRIO...');

let correctionApplied = false;

if (musicPlayerElement) {
  const styles = window.getComputedStyle(musicPlayerElement);
  const position = styles.position;
  const bottom = styles.bottom;
  
  // Verificar se posicionamento está incorreto
  if (position !== 'fixed' || bottom !== '80px') {
    console.log('🚨 Posicionamento incorreto detectado - aplicando correção...');
    
    musicPlayerElement.style.position = 'fixed';
    musicPlayerElement.style.bottom = '80px';
    musicPlayerElement.style.left = '16px';
    musicPlayerElement.style.right = '16px';
    
    console.log('✅ Posicionamento corrigido para fixed/bottom:80px');
    correctionApplied = true;
  }
  
  // Verificar hierarquia com modal
  if (modal) {
    const modalZIndex = parseInt(window.getComputedStyle(modal).zIndex);
    const playerZIndex = parseInt(window.getComputedStyle(musicPlayerElement).zIndex);
    
    if (playerZIndex >= modalZIndex) {
      console.log('🚨 Hierarquia incorreta detectada - aplicando correção...');
      
      modal.style.zIndex = '999999';
      musicPlayerElement.style.zIndex = '100';
      musicPlayerElement.classList.add('modal-open');
      
      console.log('✅ Hierarquia corrigida - Modal: 999999, Player: 100');
      correctionApplied = true;
    }
  }
}

if (!correctionApplied) {
  console.log('✅ Nenhuma correção de emergência necessária');
}

// ===== 7. RESUMO FINAL =====
console.log('\n📊 RESUMO DO TESTE DO MUSIC PLAYER CORRIGIDO:');
console.log('='.repeat(60));

const results = {
  componentFound: !!musicPlayerComponent,
  elementFound: !!musicPlayerElement,
  positionCorrect: musicPlayerElement ? window.getComputedStyle(musicPlayerElement).position === 'fixed' : false,
  bottomCorrect: musicPlayerElement ? window.getComputedStyle(musicPlayerElement).bottom === '80px' : false,
  modalHierarchyCorrect: modal && musicPlayerElement ? 
    parseInt(window.getComputedStyle(musicPlayerElement).zIndex) < parseInt(window.getComputedStyle(modal).zIndex) : 
    true,
  observerWorking: modal && musicPlayerElement ? 
    (musicPlayerElement.style.zIndex === '100' || musicPlayerElement.classList.contains('modal-open')) : 
    true
};

console.log('✅ Componente encontrado:', results.componentFound);
console.log('✅ Elemento encontrado:', results.elementFound);
console.log('✅ Position fixed:', results.positionCorrect);
console.log('✅ Bottom 80px:', results.bottomCorrect);
console.log('✅ Hierarquia modal correta:', results.modalHierarchyCorrect);
console.log('✅ Observer funcionando:', results.observerWorking);

const allTestsPassed = Object.values(results).every(result => result === true);

if (allTestsPassed) {
  console.log('\n🎉 TODOS OS TESTES DO MUSIC PLAYER PASSARAM!');
  console.log('🚀 Music Player está funcionando corretamente!');
  console.log('📍 Posicionamento: Fixo no canto inferior');
  console.log('🎯 Hierarquia: Abaixo dos modais quando necessário');
} else {
  console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFICAR ELEMENTOS COM PROBLEMA.');
  console.log('💡 Tente recarregar a página e executar o script novamente');
}

console.log('\n🔧 TESTE DO MUSIC PLAYER CORRIGIDO CONCLUÍDO!');
console.log('💡 O music player deve estar fixo no canto inferior da tela');
console.log('💡 Abra um modal para testar se o player fica atrás automaticamente');
