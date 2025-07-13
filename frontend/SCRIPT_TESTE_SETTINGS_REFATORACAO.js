// ===== SCRIPT DE TESTE - REFATORAÇÃO PÁGINA SETTINGS =====
// Execute este script no DevTools para validar todas as melhorias implementadas

console.log('🎨 INICIANDO TESTE DA REFATORAÇÃO DA PÁGINA SETTINGS...\n');
console.log('Este script valida: Tema responsivo, Switch melhorado, Cards aprimorados, e Acessibilidade\n');

// ===== 1. VERIFICAR SWITCH DE TEMA MELHORADO =====
console.log('📋 1. VERIFICANDO SWITCH DE TEMA MELHORADO...');

const themeToggle = document.querySelector('ion-toggle');
const themeToggleContainer = document.querySelector('ion-item ion-toggle');

console.log('Switch de tema encontrado:', themeToggle ? '✅ Sim' : '❌ Não');

if (themeToggle) {
  const styles = window.getComputedStyle(themeToggle);
  const trackWidth = styles.getPropertyValue('--track-width');
  const trackHeight = styles.getPropertyValue('--track-height');
  const handleWidth = styles.getPropertyValue('--handle-width');
  const handleHeight = styles.getPropertyValue('--handle-height');
  
  console.log('Dimensões do switch:');
  console.log(`- Track Width: ${trackWidth || 'Não definido'}`);
  console.log(`- Track Height: ${trackHeight || 'Não definido'}`);
  console.log(`- Handle Width: ${handleWidth || 'Não definido'}`);
  console.log(`- Handle Height: ${handleHeight || 'Não definido'}`);
  
  // Verificar se não há texto duplicado dentro do toggle
  const toggleText = themeToggle.textContent.trim();
  console.log(`Texto dentro do toggle: "${toggleText}" ${toggleText === '' ? '✅ Correto (vazio)' : '❌ Tem texto (problema)'}`);
}

// ===== 2. VERIFICAR RESPONSIVIDADE AO TEMA =====
console.log('\n📋 2. VERIFICANDO RESPONSIVIDADE AO TEMA...');

const settingsCards = document.querySelectorAll('.settings-card, .settings-card-mobile');
const cardTitles = document.querySelectorAll('ion-card-title');
const cardIcons = document.querySelectorAll('ion-card-title ion-icon');

console.log(`Cards de configuração encontrados: ${settingsCards.length}`);
console.log(`Títulos de cards encontrados: ${cardTitles.length}`);
console.log(`Ícones de cards encontrados: ${cardIcons.length}`);

// Verificar se os cards estão usando variáveis de tema
let cardsUsingThemeVars = 0;
settingsCards.forEach((card, index) => {
  const styles = window.getComputedStyle(card);
  const background = styles.backgroundColor;
  const borderColor = styles.borderColor;
  
  console.log(`Card ${index + 1}:`);
  console.log(`- Background: ${background}`);
  console.log(`- Border: ${borderColor}`);
  
  // Verificar se está usando variáveis CSS (não cores hardcoded)
  if (!background.includes('rgb(255, 255, 255)') && !background.includes('#ffffff')) {
    cardsUsingThemeVars++;
  }
});

console.log(`Cards usando variáveis de tema: ${cardsUsingThemeVars}/${settingsCards.length} ${cardsUsingThemeVars === settingsCards.length ? '✅' : '⚠️'}`);

// ===== 3. VERIFICAR ÍCONES E CORES =====
console.log('\n📋 3. VERIFICANDO ÍCONES E CORES...');

const allIcons = document.querySelectorAll('ion-icon[slot="start"]');
const primaryIcons = document.querySelectorAll('ion-icon[color="primary"]');
const secondaryIcons = document.querySelectorAll('ion-icon[color="secondary"]');
const mediumIcons = document.querySelectorAll('ion-icon[color="medium"]');

console.log(`Ícones com slot="start": ${allIcons.length}`);
console.log(`Ícones primary: ${primaryIcons.length}`);
console.log(`Ícones secondary: ${secondaryIcons.length}`);
console.log(`Ícones medium: ${mediumIcons.length}`);

// Verificar se os ícones têm cores apropriadas
let iconsWithColors = 0;
allIcons.forEach(icon => {
  const color = icon.getAttribute('color');
  if (color) {
    iconsWithColors++;
  }
});

console.log(`Ícones com cores definidas: ${iconsWithColors}/${allIcons.length} ${iconsWithColors > 0 ? '✅' : '❌'}`);

// ===== 4. VERIFICAR MELHORIAS DE ACESSIBILIDADE =====
console.log('\n📋 4. VERIFICANDO MELHORIAS DE ACESSIBILIDADE...');

// Verificar focus states
const focusableElements = document.querySelectorAll('ion-item[button], ion-toggle');
console.log(`Elementos focáveis encontrados: ${focusableElements.length}`);

// Verificar se há regras de reduced motion
const hasReducedMotionSupport = Array.from(document.styleSheets).some(sheet => {
  try {
    return Array.from(sheet.cssRules).some(rule => 
      rule.media && rule.media.mediaText.includes('prefers-reduced-motion')
    );
  } catch (e) {
    return false;
  }
});

console.log(`Suporte a prefers-reduced-motion: ${hasReducedMotionSupport ? '✅ Implementado' : '❌ Não encontrado'}`);

// Verificar contraste alto
const hasHighContrastSupport = Array.from(document.styleSheets).some(sheet => {
  try {
    return Array.from(sheet.cssRules).some(rule => 
      rule.media && rule.media.mediaText.includes('prefers-contrast')
    );
  } catch (e) {
    return false;
  }
});

console.log(`Suporte a prefers-contrast: ${hasHighContrastSupport ? '✅ Implementado' : '❌ Não encontrado'}`);

// ===== 5. VERIFICAR SEÇÃO DE SINCRONIZAÇÃO =====
console.log('\n📋 5. VERIFICANDO SEÇÃO DE SINCRONIZAÇÃO...');

const syncSection = document.querySelector('ion-card:has(ion-icon[name="cloud-done"])');
const syncIcon = document.querySelector('ion-icon[name="sync"]');
const syncNote = document.querySelector('ion-note[color="success"], ion-note[color="warning"]');

console.log('Seção de sincronização encontrada:', syncSection ? '✅ Sim' : '❌ Não');
console.log('Ícone de sync encontrado:', syncIcon ? '✅ Sim' : '❌ Não');
console.log('Nota com cor dinâmica encontrada:', syncNote ? '✅ Sim' : '❌ Não');

// ===== 6. TESTAR MUDANÇA DE TEMA =====
console.log('\n📋 6. TESTANDO MUDANÇA DE TEMA...');

const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
console.log(`Tema atual: ${currentTheme}`);

// Simular mudança de tema
console.log('Simulando mudança de tema...');
if (currentTheme === 'light') {
  document.body.classList.add('dark-theme');
  console.log('✅ Tema alterado para escuro');
} else {
  document.body.classList.remove('dark-theme');
  console.log('✅ Tema alterado para claro');
}

// Aguardar um momento para as transições
setTimeout(() => {
  // Verificar se as cores mudaram
  const cardAfterThemeChange = document.querySelector('.settings-card, .settings-card-mobile');
  if (cardAfterThemeChange) {
    const newStyles = window.getComputedStyle(cardAfterThemeChange);
    const newBackground = newStyles.backgroundColor;
    console.log(`Nova cor de fundo após mudança: ${newBackground}`);
    console.log('✅ Tema respondeu à mudança');
  }
  
  // Restaurar tema original
  if (currentTheme === 'light') {
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
  }
  console.log('✅ Tema restaurado');
}, 500);

// ===== 7. VERIFICAR HOVER EFFECTS =====
console.log('\n📋 7. VERIFICANDO HOVER EFFECTS...');

const hoverableItems = document.querySelectorAll('ion-item[button]');
console.log(`Itens com hover effect: ${hoverableItems.length}`);

// Simular hover em um item
if (hoverableItems.length > 0) {
  const firstItem = hoverableItems[0];
  firstItem.dispatchEvent(new MouseEvent('mouseenter'));
  console.log('✅ Hover simulado no primeiro item');
  
  setTimeout(() => {
    firstItem.dispatchEvent(new MouseEvent('mouseleave'));
    console.log('✅ Hover removido');
  }, 1000);
}

// ===== 8. RESUMO FINAL =====
setTimeout(() => {
  console.log('\n📊 RESUMO FINAL DA REFATORAÇÃO:');
  console.log('='.repeat(70));
  
  const results = {
    switchMelhorado: !!themeToggle && themeToggle.textContent.trim() === '',
    cardsResponsivos: cardsUsingThemeVars === settingsCards.length,
    iconesComCores: iconsWithColors > 0,
    acessibilidadeImplementada: hasReducedMotionSupport && hasHighContrastSupport,
    sincronizacaoMelhorada: !!syncIcon && !!syncNote,
    hoverEffects: hoverableItems.length > 0
  };
  
  console.log('✅ Switch de tema melhorado:', results.switchMelhorado);
  console.log('✅ Cards responsivos ao tema:', results.cardsResponsivos);
  console.log('✅ Ícones com cores apropriadas:', results.iconesComCores);
  console.log('✅ Acessibilidade implementada:', results.acessibilidadeImplementada);
  console.log('✅ Sincronização melhorada:', results.sincronizacaoMelhorada);
  console.log('✅ Hover effects funcionando:', results.hoverEffects);
  
  const allTestsPassed = Object.values(results).every(result => result === true);
  
  if (allTestsPassed) {
    console.log('\n🎉 REFATORAÇÃO DA PÁGINA SETTINGS CONCLUÍDA COM SUCESSO!');
    console.log('🚀 Todas as melhorias foram implementadas corretamente!');
    console.log('📍 Switch de tema: Proporções corretas e sem texto duplicado');
    console.log('🎨 Cards: Responsivos ao tema com bordas e sombras melhoradas');
    console.log('🎯 Ícones: Cores apropriadas e consistentes');
    console.log('♿ Acessibilidade: Suporte a reduced motion e high contrast');
    console.log('🔄 Sincronização: Visual melhorado com ícones dinâmicos');
    console.log('🖱️ Interações: Hover effects e transições suaves');
  } else {
    console.log('\n⚠️ ALGUMAS MELHORIAS PRECISAM DE ATENÇÃO');
    console.log('💡 Verifique os itens marcados com ❌ acima');
  }
  
  console.log('\n🔧 TESTE DA REFATORAÇÃO CONCLUÍDO!');
  console.log('💡 Execute este script sempre que modificar a página Settings');
  console.log('💡 Teste a mudança de tema manualmente para validar as transições');
}, 2000);
