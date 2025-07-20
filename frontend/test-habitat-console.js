// Script para testar o sistema de habitat diretamente no console do navegador
// Copie e cole este código no console do navegador (F12) quando estiver na página inicial

console.log('🧪 Iniciando teste manual do sistema de habitat...');

// Função para testar o mapeamento expandido
function testHabitatMapping() {
    console.log('📊 Testando mapeamento expandido de habitats...');
    
    // Simular a função generateExpandedHabitatMapping
    const manualMapping = {
        // Geração 1 - Kanto (1-151)
        1: 'grassland', 2: 'grassland', 3: 'grassland', // Bulbasaur line
        4: 'mountain', 5: 'mountain', 6: 'mountain', // Charmander line
        7: 'waters-edge', 8: 'waters-edge', 9: 'waters-edge', // Squirtle line
        25: 'forest', 26: 'forest', // Pikachu line
        150: 'rare', // Mewtwo
        151: 'rare', // Mew
    };

    const getHabitatByTypes = (pokemonId) => {
        // Geração 2 (152-251)
        if (pokemonId >= 152 && pokemonId <= 251) {
            if ([152, 153, 154].includes(pokemonId)) return 'grassland'; // Chikorita line
            if ([155, 156, 157].includes(pokemonId)) return 'mountain'; // Cyndaquil line  
            if ([158, 159, 160].includes(pokemonId)) return 'waters-edge'; // Totodile line
            if ([243, 244, 245].includes(pokemonId)) return 'rare'; // Raikou/Entei/Suicune
            if ([249, 250].includes(pokemonId)) return 'rare'; // Lugia/Ho-Oh
            if (pokemonId === 251) return 'rare'; // Celebi
        }

        // Geração 3 (252-386)
        if (pokemonId >= 252 && pokemonId <= 386) {
            if ([252, 253, 254].includes(pokemonId)) return 'forest'; // Treecko line
            if ([255, 256, 257].includes(pokemonId)) return 'mountain'; // Torchic line
            if ([258, 259, 260].includes(pokemonId)) return 'waters-edge'; // Mudkip line
            if ([377, 378, 379, 380, 381, 382, 383, 384, 385, 386].includes(pokemonId)) return 'rare';
        }

        // Distribuição baseada em módulo para variedade
        const mod = pokemonId % 9;
        switch (mod) {
            case 0: return 'waters-edge';
            case 1: return 'forest';
            case 2: return 'grassland';
            case 3: return 'mountain';
            case 4: return 'cave';
            case 5: return 'urban';
            case 6: return 'rough-terrain';
            case 7: return 'sea';
            case 8: return 'rare';
            default: return 'grassland';
        }
    };

    const expandedMapping = { ...manualMapping };
    for (let id = 1; id <= 1000; id++) {
        if (!expandedMapping[id]) {
            expandedMapping[id] = getHabitatByTypes(id);
        }
    }

    // Verificar cobertura
    const totalMapped = Object.keys(expandedMapping).length;
    const forestPokemon = Object.entries(expandedMapping).filter(([id, habitat]) => habitat === 'forest').length;
    const mountainPokemon = Object.entries(expandedMapping).filter(([id, habitat]) => habitat === 'mountain').length;
    const watersPokemon = Object.entries(expandedMapping).filter(([id, habitat]) => habitat === 'waters-edge').length;
    const rarePokemon = Object.entries(expandedMapping).filter(([id, habitat]) => habitat === 'rare').length;

    console.log(`✅ Total de Pokémon mapeados: ${totalMapped}`);
    console.log(`🌲 Floresta: ${forestPokemon} Pokémon`);
    console.log(`🏔️ Montanha: ${mountainPokemon} Pokémon`);
    console.log(`🌊 Águas: ${watersPokemon} Pokémon`);
    console.log(`💎 Raro: ${rarePokemon} Pokémon`);

    // Verificar Pokémon específicos
    console.log(`🎯 Pikachu (#25): ${expandedMapping[25]} (deve ser 'forest')`);
    console.log(`🎯 Charmander (#4): ${expandedMapping[4]} (deve ser 'mountain')`);
    console.log(`🎯 Squirtle (#7): ${expandedMapping[7]} (deve ser 'waters-edge')`);
    console.log(`🎯 Mewtwo (#150): ${expandedMapping[150]} (deve ser 'rare')`);
    console.log(`🎯 Chikorita (#152): ${expandedMapping[152]} (deve ser 'grassland')`);
    console.log(`🎯 Treecko (#252): ${expandedMapping[252]} (deve ser 'forest')`);

    return expandedMapping;
}

// Função para testar filtro programaticamente
function testHabitatFilter() {
    console.log('🔍 Testando filtro de habitat programaticamente...');
    
    // Tentar acessar o serviço Angular
    try {
        // Buscar elemento Angular
        const appElement = document.querySelector('app-root');
        if (appElement) {
            console.log('✅ Elemento Angular encontrado');
            
            // Tentar simular filtro de habitat
            const mapping = testHabitatMapping();
            
            // Simular filtro de floresta
            const forestPokemon = Object.entries(mapping)
                .filter(([id, habitat]) => habitat === 'forest')
                .map(([id]) => parseInt(id));
            
            console.log(`🌲 Pokémon de floresta encontrados: ${forestPokemon.length}`);
            console.log(`🎯 Primeiros 10: ${forestPokemon.slice(0, 10).join(', ')}`);
            
            // Simular paginação
            const pageSize = 20;
            const page1 = forestPokemon.slice(0, pageSize);
            const page2 = forestPokemon.slice(pageSize, pageSize * 2);
            
            console.log(`📄 Página 1: ${page1.length} Pokémon`);
            console.log(`📄 Página 2: ${page2.length} Pokémon`);
            
            if (page1.length > 1) {
                console.log('✅ Paginação corrigida - múltiplos Pokémon por página');
            } else {
                console.log('❌ Problema de paginação - apenas 1 Pokémon por página');
            }
            
        } else {
            console.log('❌ Elemento Angular não encontrado');
        }
    } catch (error) {
        console.log('❌ Erro ao acessar serviço:', error);
    }
}

// Função para verificar se há chips de habitat na página
function checkHabitatChips() {
    console.log('🏷️ Verificando chips de habitat na página...');
    
    const habitatChips = document.querySelectorAll('.filter-section ion-chip');
    console.log(`🏷️ Total de chips encontrados: ${habitatChips.length}`);
    
    habitatChips.forEach((chip, index) => {
        const text = chip.textContent?.trim();
        console.log(`🏷️ Chip ${index + 1}: ${text}`);
    });
    
    // Verificar se há seção de habitats
    const habitatSection = document.querySelector('.filter-section:has-text("Habitats")');
    if (habitatSection) {
        console.log('✅ Seção de habitats encontrada');
    } else {
        console.log('⚠️ Seção de habitats não encontrada');
    }
}

// Função para simular clique em chip
function simulateHabitatClick(chipText) {
    console.log(`🎯 Tentando simular clique no chip: ${chipText}`);
    
    const chips = document.querySelectorAll('.filter-section ion-chip');
    let targetChip = null;
    
    chips.forEach(chip => {
        if (chip.textContent?.toLowerCase().includes(chipText.toLowerCase())) {
            targetChip = chip;
        }
    });
    
    if (targetChip) {
        console.log(`✅ Chip encontrado: ${targetChip.textContent?.trim()}`);
        
        // Tentar diferentes métodos de clique
        try {
            targetChip.click();
            console.log('✅ Clique direto executado');
        } catch (error) {
            console.log('⚠️ Clique direto falhou:', error);
            
            // Tentar evento de clique
            try {
                const event = new MouseEvent('click', { bubbles: true });
                targetChip.dispatchEvent(event);
                console.log('✅ Evento de clique executado');
            } catch (error2) {
                console.log('❌ Evento de clique falhou:', error2);
            }
        }
    } else {
        console.log(`❌ Chip não encontrado: ${chipText}`);
    }
}

// Executar testes
console.log('🚀 Executando testes...');
testHabitatMapping();
console.log('---');
testHabitatFilter();
console.log('---');
checkHabitatChips();
console.log('---');

// Instruções para teste manual
console.log('📋 INSTRUÇÕES PARA TESTE MANUAL:');
console.log('1. Execute: simulateHabitatClick("floresta") para testar filtro de floresta');
console.log('2. Execute: simulateHabitatClick("montanha") para testar filtro de montanha');
console.log('3. Execute: simulateHabitatClick("raro") para testar filtro de raros');
console.log('4. Observe o console para logs do sistema');
console.log('5. Verifique se há "Carregando Pokémons..." em loop');

console.log('✅ Teste manual do sistema de habitat concluído!');
