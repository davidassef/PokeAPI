import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PokemonSpecies {
  id: number;
  name: string;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
      url: string;
    };
    version: {
      name: string;
      url: string;
    };
  }>;
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  genera: Array<{
    genus: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonTranslationService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private translationCache = new Map<string, any>();

  // Mapeamento manual para os primeiros 151 Pokémons (Geração 1)
  private pokemonNames: { [key: string]: { [key: string]: string } } = {
    pt: {
      'bulbasaur': 'Bulbassauro',
      'ivysaur': 'Ivysaur',
      'venusaur': 'Venusaur',
      'charmander': 'Charmander',
      'charmeleon': 'Charmeleon',
      'charizard': 'Charizard',
      'squirtle': 'Squirtle',
      'wartortle': 'Wartortle',
      'blastoise': 'Blastoise',
      'caterpie': 'Caterpie',
      'metapod': 'Metapod',
      'butterfree': 'Butterfree',
      'weedle': 'Weedle',
      'kakuna': 'Kakuna',
      'beedrill': 'Beedrill',
      'pidgey': 'Pidgey',
      'pidgeotto': 'Pidgeotto',
      'pidgeot': 'Pidgeot',
      'rattata': 'Rattata',
      'raticate': 'Raticate',
      'spearow': 'Spearow',
      'fearow': 'Fearow',
      'ekans': 'Ekans',
      'arbok': 'Arbok',
      'pikachu': 'Pikachu',
      'raichu': 'Raichu',
      'sandshrew': 'Sandshrew',
      'sandslash': 'Sandslash',
      'nidoran-f': 'Nidoran♀',
      'nidorina': 'Nidorina',
      'nidoqueen': 'Nidoqueen',
      'nidoran-m': 'Nidoran♂',
      'nidorino': 'Nidorino',
      'nidoking': 'Nidoking',
      'clefairy': 'Clefairy',
      'clefable': 'Clefable',
      'vulpix': 'Vulpix',
      'ninetales': 'Ninetales',
      'jigglypuff': 'Jigglypuff',
      'wigglytuff': 'Wigglytuff',
      'zubat': 'Zubat',
      'golbat': 'Golbat',
      'oddish': 'Oddish',
      'gloom': 'Gloom',
      'vileplume': 'Vileplume',
      'paras': 'Paras',
      'parasect': 'Parasect',
      'venonat': 'Venonat',
      'venomoth': 'Venomoth',
      'diglett': 'Diglett',
      'dugtrio': 'Dugtrio',
      'meowth': 'Meowth',
      'persian': 'Persian',
      'psyduck': 'Psyduck',
      'golduck': 'Golduck',
      'mankey': 'Mankey',
      'primeape': 'Primeape',
      'growlithe': 'Growlithe',
      'arcanine': 'Arcanine',
      'poliwag': 'Poliwag',
      'poliwhirl': 'Poliwhirl',
      'poliwrath': 'Poliwrath',
      'abra': 'Abra',
      'kadabra': 'Kadabra',
      'alakazam': 'Alakazam',
      'machop': 'Machop',
      'machoke': 'Machoke',
      'machamp': 'Machamp',
      'bellsprout': 'Bellsprout',
      'weepinbell': 'Weepinbell',
      'victreebel': 'Victreebel',
      'tentacool': 'Tentacool',
      'tentacruel': 'Tentacruel',
      'geodude': 'Geodude',
      'graveler': 'Graveler',
      'golem': 'Golem',
      'ponyta': 'Ponyta',
      'rapidash': 'Rapidash',
      'slowpoke': 'Slowpoke',
      'slowbro': 'Slowbro',
      'magnemite': 'Magnemite',
      'magneton': 'Magneton',
      'farfetchd': 'Farfetch\'d',
      'doduo': 'Doduo',
      'dodrio': 'Dodrio',
      'seel': 'Seel',
      'dewgong': 'Dewgong',
      'grimer': 'Grimer',
      'muk': 'Muk',
      'shellder': 'Shellder',
      'cloyster': 'Cloyster',
      'gastly': 'Gastly',
      'haunter': 'Haunter',
      'gengar': 'Gengar',
      'onix': 'Onix',
      'drowzee': 'Drowzee',
      'hypno': 'Hypno',
      'krabby': 'Krabby',
      'kingler': 'Kingler',
      'voltorb': 'Voltorb',
      'electrode': 'Electrode',
      'exeggcute': 'Exeggcute',
      'exeggutor': 'Exeggutor',
      'cubone': 'Cubone',
      'marowak': 'Marowak',
      'hitmonlee': 'Hitmonlee',
      'hitmonchan': 'Hitmonchan',
      'lickitung': 'Lickitung',
      'koffing': 'Koffing',
      'weezing': 'Weezing',
      'rhyhorn': 'Rhyhorn',
      'rhydon': 'Rhydon',
      'chansey': 'Chansey',
      'tangela': 'Tangela',
      'kangaskhan': 'Kangaskhan',
      'horsea': 'Horsea',
      'seadra': 'Seadra',
      'goldeen': 'Goldeen',
      'seaking': 'Seaking',
      'staryu': 'Staryu',
      'starmie': 'Starmie',
      'mr-mime': 'Mr. Mime',
      'scyther': 'Scyther',
      'jynx': 'Jynx',
      'electabuzz': 'Electabuzz',
      'magmar': 'Magmar',
      'pinsir': 'Pinsir',
      'tauros': 'Tauros',
      'magikarp': 'Magikarp',
      'gyarados': 'Gyarados',
      'lapras': 'Lapras',
      'ditto': 'Ditto',
      'eevee': 'Eevee',
      'vaporeon': 'Vaporeon',
      'jolteon': 'Jolteon',
      'flareon': 'Flareon',
      'porygon': 'Porygon',
      'omanyte': 'Omanyte',
      'omastar': 'Omastar',
      'kabuto': 'Kabuto',
      'kabutops': 'Kabutops',
      'aerodactyl': 'Aerodactyl',
      'snorlax': 'Snorlax',
      'articuno': 'Articuno',
      'zapdos': 'Zapdos',
      'moltres': 'Moltres',
      'dratini': 'Dratini',
      'dragonair': 'Dragonair',
      'dragonite': 'Dragonite',
      'mewtwo': 'Mewtwo',
      'mew': 'Mew'
    },
    en: {
      'bulbasaur': 'Bulbasaur',
      'ivysaur': 'Ivysaur',
      'venusaur': 'Venusaur',
      'charmander': 'Charmander',
      'charmeleon': 'Charmeleon',
      'charizard': 'Charizard',
      'squirtle': 'Squirtle',
      'wartortle': 'Wartortle',
      'blastoise': 'Blastoise',
      'caterpie': 'Caterpie',
      'metapod': 'Metapod',
      'butterfree': 'Butterfree',
      'weedle': 'Weedle',
      'kakuna': 'Kakuna',
      'beedrill': 'Beedrill',
      'pidgey': 'Pidgey',
      'pidgeotto': 'Pidgeotto',
      'pidgeot': 'Pidgeot',
      'rattata': 'Rattata',
      'raticate': 'Raticate',
      'spearow': 'Spearow',
      'fearow': 'Fearow',
      'ekans': 'Ekans',
      'arbok': 'Arbok',
      'pikachu': 'Pikachu',
      'raichu': 'Raichu',
      'sandshrew': 'Sandshrew',
      'sandslash': 'Sandslash',
      'nidoran-f': 'Nidoran♀',
      'nidorina': 'Nidorina',
      'nidoqueen': 'Nidoqueen',
      'nidoran-m': 'Nidoran♂',
      'nidorino': 'Nidorino',
      'nidoking': 'Nidoking',
      'clefairy': 'Clefairy',
      'clefable': 'Clefable',
      'vulpix': 'Vulpix',
      'ninetales': 'Ninetales',
      'jigglypuff': 'Jigglypuff',
      'wigglytuff': 'Wigglytuff',
      'zubat': 'Zubat',
      'golbat': 'Golbat',
      'oddish': 'Oddish',
      'gloom': 'Gloom',
      'vileplume': 'Vileplume',
      'paras': 'Paras',
      'parasect': 'Parasect',
      'venonat': 'Venonat',
      'venomoth': 'Venomoth',
      'diglett': 'Diglett',
      'dugtrio': 'Dugtrio',
      'meowth': 'Meowth',
      'persian': 'Persian',
      'psyduck': 'Psyduck',
      'golduck': 'Golduck',
      'mankey': 'Mankey',
      'primeape': 'Primeape',
      'growlithe': 'Growlithe',
      'arcanine': 'Arcanine',
      'poliwag': 'Poliwag',
      'poliwhirl': 'Poliwhirl',
      'poliwrath': 'Poliwrath',
      'abra': 'Abra',
      'kadabra': 'Kadabra',
      'alakazam': 'Alakazam',
      'machop': 'Machop',
      'machoke': 'Machoke',
      'machamp': 'Machamp',
      'bellsprout': 'Bellsprout',
      'weepinbell': 'Weepinbell',
      'victreebel': 'Victreebel',
      'tentacool': 'Tentacool',
      'tentacruel': 'Tentacruel',
      'geodude': 'Geodude',
      'graveler': 'Graveler',
      'golem': 'Golem',
      'ponyta': 'Ponyta',
      'rapidash': 'Rapidash',
      'slowpoke': 'Slowpoke',
      'slowbro': 'Slowbro',
      'magnemite': 'Magnemite',
      'magneton': 'Magneton',
      'farfetchd': 'Farfetch\'d',
      'doduo': 'Doduo',
      'dodrio': 'Dodrio',
      'seel': 'Seel',
      'dewgong': 'Dewgong',
      'grimer': 'Grimer',
      'muk': 'Muk',
      'shellder': 'Shellder',
      'cloyster': 'Cloyster',
      'gastly': 'Gastly',
      'haunter': 'Haunter',
      'gengar': 'Gengar',
      'onix': 'Onix',
      'drowzee': 'Drowzee',
      'hypno': 'Hypno',
      'krabby': 'Krabby',
      'kingler': 'Kingler',
      'voltorb': 'Voltorb',
      'electrode': 'Electrode',
      'exeggcute': 'Exeggcute',
      'exeggutor': 'Exeggutor',
      'cubone': 'Cubone',
      'marowak': 'Marowak',
      'hitmonlee': 'Hitmonlee',
      'hitmonchan': 'Hitmonchan',
      'lickitung': 'Lickitung',
      'koffing': 'Koffing',
      'weezing': 'Weezing',
      'rhyhorn': 'Rhyhorn',
      'rhydon': 'Rhydon',
      'chansey': 'Chansey',
      'tangela': 'Tangela',
      'kangaskhan': 'Kangaskhan',
      'horsea': 'Horsea',
      'seadra': 'Seadra',
      'goldeen': 'Goldeen',
      'seaking': 'Seaking',
      'staryu': 'Staryu',
      'starmie': 'Starmie',
      'mr-mime': 'Mr. Mime',
      'scyther': 'Scyther',
      'jynx': 'Jynx',
      'electabuzz': 'Electabuzz',
      'magmar': 'Magmar',
      'pinsir': 'Pinsir',
      'tauros': 'Tauros',
      'magikarp': 'Magikarp',
      'gyarados': 'Gyarados',
      'lapras': 'Lapras',
      'ditto': 'Ditto',
      'eevee': 'Eevee',
      'vaporeon': 'Vaporeon',
      'jolteon': 'Jolteon',
      'flareon': 'Flareon',
      'porygon': 'Porygon',
      'omanyte': 'Omanyte',
      'omastar': 'Omastar',
      'kabuto': 'Kabuto',
      'kabutops': 'Kabutops',
      'aerodactyl': 'Aerodactyl',
      'snorlax': 'Snorlax',
      'articuno': 'Articuno',
      'zapdos': 'Zapdos',
      'moltres': 'Moltres',
      'dratini': 'Dratini',
      'dragonair': 'Dragonair',
      'dragonite': 'Dragonite',
      'mewtwo': 'Mewtwo',
      'mew': 'Mew'
    },
    es: {
      'bulbasaur': 'Bulbasaur',
      'ivysaur': 'Ivysaur',
      'venusaur': 'Venusaur',
      'charmander': 'Charmander',
      'charmeleon': 'Charmeleon',
      'charizard': 'Charizard',
      'squirtle': 'Squirtle',
      'wartortle': 'Wartortle',
      'blastoise': 'Blastoise',
      'caterpie': 'Caterpie',
      'metapod': 'Metapod',
      'butterfree': 'Butterfree',
      'weedle': 'Weedle',
      'kakuna': 'Kakuna',
      'beedrill': 'Beedrill',
      'pidgey': 'Pidgey',
      'pidgeotto': 'Pidgeotto',
      'pidgeot': 'Pidgeot',
      'rattata': 'Rattata',
      'raticate': 'Raticate',
      'spearow': 'Spearow',
      'fearow': 'Fearow',
      'ekans': 'Ekans',
      'arbok': 'Arbok',
      'pikachu': 'Pikachu',
      'raichu': 'Raichu',
      'sandshrew': 'Sandshrew',
      'sandslash': 'Sandslash',
      'nidoran-f': 'Nidoran♀',
      'nidorina': 'Nidorina',
      'nidoqueen': 'Nidoqueen',
      'nidoran-m': 'Nidoran♂',
      'nidorino': 'Nidorino',
      'nidoking': 'Nidoking',
      'clefairy': 'Clefairy',
      'clefable': 'Clefable',
      'vulpix': 'Vulpix',
      'ninetales': 'Ninetales',
      'jigglypuff': 'Jigglypuff',
      'wigglytuff': 'Wigglytuff',
      'zubat': 'Zubat',
      'golbat': 'Golbat',
      'oddish': 'Oddish',
      'gloom': 'Gloom',
      'vileplume': 'Vileplume',
      'paras': 'Paras',
      'parasect': 'Parasect',
      'venonat': 'Venonat',
      'venomoth': 'Venomoth',
      'diglett': 'Diglett',
      'dugtrio': 'Dugtrio',
      'meowth': 'Meowth',
      'persian': 'Persian',
      'psyduck': 'Psyduck',
      'golduck': 'Golduck',
      'mankey': 'Mankey',
      'primeape': 'Primeape',
      'growlithe': 'Growlithe',
      'arcanine': 'Arcanine',
      'poliwag': 'Poliwag',
      'poliwhirl': 'Poliwhirl',
      'poliwrath': 'Poliwrath',
      'abra': 'Abra',
      'kadabra': 'Kadabra',
      'alakazam': 'Alakazam',
      'machop': 'Machop',
      'machoke': 'Machoke',
      'machamp': 'Machamp',
      'bellsprout': 'Bellsprout',
      'weepinbell': 'Weepinbell',
      'victreebel': 'Victreebel',
      'tentacool': 'Tentacool',
      'tentacruel': 'Tentacruel',
      'geodude': 'Geodude',
      'graveler': 'Graveler',
      'golem': 'Golem',
      'ponyta': 'Ponyta',
      'rapidash': 'Rapidash',
      'slowpoke': 'Slowpoke',
      'slowbro': 'Slowbro',
      'magnemite': 'Magnemite',
      'magneton': 'Magneton',
      'farfetchd': 'Farfetch\'d',
      'doduo': 'Doduo',
      'dodrio': 'Dodrio',
      'seel': 'Seel',
      'dewgong': 'Dewgong',
      'grimer': 'Grimer',
      'muk': 'Muk',
      'shellder': 'Shellder',
      'cloyster': 'Cloyster',
      'gastly': 'Gastly',
      'haunter': 'Haunter',
      'gengar': 'Gengar',
      'onix': 'Onix',
      'drowzee': 'Drowzee',
      'hypno': 'Hypno',
      'krabby': 'Krabby',
      'kingler': 'Kingler',
      'voltorb': 'Voltorb',
      'electrode': 'Electrode',
      'exeggcute': 'Exeggcute',
      'exeggutor': 'Exeggutor',
      'cubone': 'Cubone',
      'marowak': 'Marowak',
      'hitmonlee': 'Hitmonlee',
      'hitmonchan': 'Hitmonchan',
      'lickitung': 'Lickitung',
      'koffing': 'Koffing',
      'weezing': 'Weezing',
      'rhyhorn': 'Rhyhorn',
      'rhydon': 'Rhydon',
      'chansey': 'Chansey',
      'tangela': 'Tangela',
      'kangaskhan': 'Kangaskhan',
      'horsea': 'Horsea',
      'seadra': 'Seadra',
      'goldeen': 'Goldeen',
      'seaking': 'Seaking',
      'staryu': 'Staryu',
      'starmie': 'Starmie',
      'mr-mime': 'Mr. Mime',
      'scyther': 'Scyther',
      'jynx': 'Jynx',
      'electabuzz': 'Electabuzz',
      'magmar': 'Magmar',
      'pinsir': 'Pinsir',
      'tauros': 'Tauros',
      'magikarp': 'Magikarp',
      'gyarados': 'Gyarados',
      'lapras': 'Lapras',
      'ditto': 'Ditto',
      'eevee': 'Eevee',
      'vaporeon': 'Vaporeon',
      'jolteon': 'Jolteon',
      'flareon': 'Flareon',
      'porygon': 'Porygon',
      'omanyte': 'Omanyte',
      'omastar': 'Omastar',
      'kabuto': 'Kabuto',
      'kabutops': 'Kabutops',
      'aerodactyl': 'Aerodactyl',
      'snorlax': 'Snorlax',
      'articuno': 'Articuno',
      'zapdos': 'Zapdos',
      'moltres': 'Moltres',
      'dratini': 'Dratini',
      'dragonair': 'Dragonair',
      'dragonite': 'Dragonite',
      'mewtwo': 'Mewtwo',
      'mew': 'Mew'
    }
  };

  // Descrições básicas dos Pokémons em português, inglês e espanhol
  private pokemonDescriptions: { [key: string]: { [key: string]: string } } = {
    pt: {
      'bulbasaur': 'Um Pokémon de tipo Grama/Veneno. Pode ficar dias sem comer graças ao bulbo em suas costas.',
      'ivysaur': 'Quando o bulbo em suas costas cresce, parece perder a capacidade de ficar em pé.',
      'venusaur': 'Sua planta libera um aroma doce que intensifica as emoções.',
      'charmander': 'Prefere lugares quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.',
      'charmeleon': 'Tem uma natureza selvagem. Suas garras afiadas são muito eficazes.',
      'charizard': 'Cospe fogo quente o suficiente para derreter quase qualquer coisa.',
      'squirtle': 'Após o nascimento, suas costas se endurecem e formam um casco.',
      'wartortle': 'É reconhecido como símbolo de longevidade. Se sua cauda for coberta de algas, é mais velho.',
      'blastoise': 'Retira-se em seu casco e atira água com força de mangueira.',
      'pikachu': 'Quando vários destes Pokémon se reúnem, sua eletricidade pode causar tempestades.',
      'raichu': 'Sua cauda funciona como um para-raios. Pode derrubar inimigos com 100.000 volts.',
      'mewtwo': 'Criado por um cientista após anos de experimentos horríveis de engenharia genética.',
      'mew': 'Tão raro que é considerado um Pokémon mítico por muitos estudiosos.'
    },
    en: {
      'bulbasaur': 'A Grass/Poison-type Pokémon. It can go days without eating due to the bulb on its back.',
      'ivysaur': 'When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs.',
      'venusaur': 'Its plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.',
      'charmander': 'It has a preference for hot things. When it rains, steam is said to spout from the tip of its tail.',
      'charmeleon': 'It has a barbaric nature. Its sharp claws are very effective.',
      'charizard': 'It spits fire that is hot enough to melt boulders.',
      'squirtle': 'After birth, its back swells and hardens into a shell.',
      'wartortle': 'It is recognized as a symbol of longevity. If its shell has algae on it, that Wartortle is very old.',
      'blastoise': 'It crushes its foe under its heavy body to cause fainting.',
      'pikachu': 'When several of these Pokémon gather, their electricity can cause lightning storms.',
      'raichu': 'Its tail functions as a lightning rod. It can knock out enemies with 100,000-volt lightning bolts.',
      'mewtwo': 'It was created by a scientist after years of horrific gene splicing experiments.',
      'mew': 'So rare that it is still said to be a mirage by many experts.'
    },
    es: {
      'bulbasaur': 'Un Pokémon de tipo Planta/Veneno. Puede pasar días sin comer gracias al bulbo de su espalda.',
      'ivysaur': 'Cuando el bulbo de su espalda crece, parece perder la capacidad de mantenerse erguido.',
      'venusaur': 'Su planta florece cuando está absorbiendo energía solar. Se mantiene en movimiento para buscar luz solar.',
      'charmander': 'Prefiere las cosas calientes. Cuando llueve, se dice que sale vapor de la punta de su cola.',
      'charmeleon': 'Tiene una naturaleza bárbara. Sus garras afiladas son muy efectivas.',
      'charizard': 'Escupe fuego que es lo suficientemente caliente como para derretir rocas.',
      'squirtle': 'Después del nacimiento, su espalda se hincha y se endurece hasta formar un caparazón.',
      'wartortle': 'Es reconocido como símbolo de longevidade. Si su caparazón tiene algas, es muy viejo.',
      'blastoise': 'Aplasta a su enemigo bajo su cuerpo pesado para causar desmayo.',
      'pikachu': 'Cuando varios de estos Pokémon se reúnen, su electricidad puede causar tormentas eléctricas.',
      'raichu': 'Su cola funciona como un pararrayos. Puede noquear enemigos con rayos de 100.000 voltios.',
      'mewtwo': 'Fue creado por un científico después de años de horribles experimentos de empalme genético.',
      'mew': 'Tan raro que todavía se dice que es un espejismo por muchos expertos.'
    }
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtém o nome traduzido de um Pokémon
   */
  getTranslatedName(pokemonName: string, language: string): string {
    const normalizedName = pokemonName.toLowerCase();
    const translatedName = this.pokemonNames[language]?.[normalizedName];

    if (translatedName) {
      return translatedName;
    }

    // Fallback para capitalizar o primeiro caractere
    return this.capitalizeFirstLetter(pokemonName);
  }

  /**
   * Obtém a descrição traduzida de um Pokémon
   */
  getTranslatedDescription(pokemonName: string, language: string): string {
    const normalizedName = pokemonName.toLowerCase();
    const description = this.pokemonDescriptions[language]?.[normalizedName];

    if (description) {
      return description;
    }

    // Fallback para descrição genérica
    const fallbackDescriptions = {
      pt: 'Um Pokémon misterioso e fascinante.',
      en: 'A mysterious and fascinating Pokémon.',
      es: 'Un Pokémon misterioso y fascinante.'
    };

    return fallbackDescriptions[language as keyof typeof fallbackDescriptions] || fallbackDescriptions.en;
  }

  /**
   * Busca informações detalhadas da PokeAPI (species endpoint)
   */
  getPokemonSpecies(pokemonId: number): Observable<PokemonSpecies> {
    const cacheKey = `species-${pokemonId}`;

    if (this.translationCache.has(cacheKey)) {
      return of(this.translationCache.get(cacheKey));
    }

    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${pokemonId}`).pipe(
      map(species => {
        this.translationCache.set(cacheKey, species);
        return species;
      }),
      catchError(error => {
        console.warn('Erro ao buscar species:', error);
        return of({} as PokemonSpecies);
      })
    );
  }

  /**
   * Extrai nome traduzido da resposta da PokeAPI
   */
  extractTranslatedNameFromSpecies(species: PokemonSpecies, language: string): string {
    if (!species.names) {
      return '';
    }

    // Mapeia códigos de idioma
    const languageMap: { [key: string]: string } = {
      'pt': 'ja-Hrkt', // Japonês como fallback, depois melhorar
      'en': 'en',
      'es': 'es'
    };

    const targetLanguage = languageMap[language] || 'en';
    const nameEntry = species.names.find(name => name.language.name === targetLanguage);

    return nameEntry ? nameEntry.name : '';
  }

  /**
   * Extrai descrição traduzida da resposta da PokeAPI
   */
  extractTranslatedDescriptionFromSpecies(species: PokemonSpecies, language: string): string {
    if (!species.flavor_text_entries) {
      return '';
    }

    // Mapeia códigos de idioma
    const languageMap: { [key: string]: string } = {
      'pt': 'en', // Português não disponível na API, usar inglês como fallback
      'en': 'en',
      'es': 'es'
    };

    const targetLanguage = languageMap[language] || 'en';
    const descriptionEntry = species.flavor_text_entries.find(entry =>
      entry.language.name === targetLanguage
    );

    if (descriptionEntry) {
      // Limpa caracteres especiais e quebras de linha
      return descriptionEntry.flavor_text
        .replace(/\f/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return '';
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Limpa cache de traduções
   */
  clearCache(): void {
    this.translationCache.clear();
  }
  /**
   * Busca descrição da PokeAPI quando tradução manual não disponível
   */
  getApiDescription(pokemonName: string, language: string): Observable<string> {
    const normalizedName = pokemonName.toLowerCase();
    const pokemonId = this.getPokemonIdFromName(normalizedName);

    if (!pokemonId) {
      return of('');
    }

    return this.getPokemonSpecies(pokemonId).pipe(
      map(species => {
        const languageMap: { [key: string]: string } = {
          'pt': 'en', // PokeAPI não tem português, usa inglês como fallback
          'en': 'en',
          'es': 'es'
        };

        const targetLanguage = languageMap[language] || 'en';
        const descriptionEntry = species.flavor_text_entries.find(entry =>
          entry.language.name === targetLanguage
        );

        if (descriptionEntry) {
          return descriptionEntry.flavor_text
            .replace(/\f/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        return '';
      }),
      catchError(() => of(''))
    );
  }

  /**
   * Converte nome do Pokémon para ID (para os principais)
   */
  private getPokemonIdFromName(name: string): number | null {
    const nameToId: { [key: string]: number } = {
      'bulbasaur': 1, 'ivysaur': 2, 'venusaur': 3,
      'charmander': 4, 'charmeleon': 5, 'charizard': 6,
      'squirtle': 7, 'wartortle': 8, 'blastoise': 9,
      'caterpie': 10, 'metapod': 11, 'butterfree': 12,
      'weedle': 13, 'kakuna': 14, 'beedrill': 15,
      'pidgey': 16, 'pidgeotto': 17, 'pidgeot': 18,
      'rattata': 19, 'raticate': 20, 'spearow': 21,
      'fearow': 22, 'ekans': 23, 'arbok': 24,
      'pikachu': 25, 'raichu': 26, 'sandshrew': 27,
      'sandslash': 28, 'nidoran-f': 29, 'nidorina': 30,
      'nidoqueen': 31, 'nidoran-m': 32, 'nidorino': 33,
      'nidoking': 34, 'clefairy': 35, 'clefable': 36,
      'vulpix': 37, 'ninetales': 38, 'jigglypuff': 39,
      'wigglytuff': 40, 'zubat': 41, 'golbat': 42,
      'oddish': 43, 'gloom': 44, 'vileplume': 45,
      'paras': 46, 'parasect': 47, 'venonat': 48,
      'venomoth': 49, 'diglett': 50, 'dugtrio': 51,
      'meowth': 52, 'persian': 53, 'psyduck': 54,
      'golduck': 55, 'mankey': 56, 'primeape': 57,
      'growlithe': 58, 'arcanine': 59, 'poliwag': 60,
      'poliwhirl': 61, 'poliwrath': 62, 'abra': 63,
      'kadabra': 64, 'alakazam': 65, 'machop': 66,
      'machoke': 67, 'machamp': 68, 'bellsprout': 69,
      'weepinbell': 70, 'victreebel': 71, 'tentacool': 72,
      'tentacruel': 73, 'geodude': 74, 'graveler': 75,
      'golem': 76, 'ponyta': 77, 'rapidash': 78,
      'slowpoke': 79, 'slowbro': 80, 'magnemite': 81,
      'magneton': 82, 'farfetchd': 83, 'doduo': 84,
      'dodrio': 85, 'seel': 86, 'dewgong': 87,
      'grimer': 88, 'muk': 89, 'shellder': 90,
      'cloyster': 91, 'gastly': 92, 'haunter': 93,
      'gengar': 94, 'onix': 95, 'drowzee': 96,
      'hypno': 97, 'krabby': 98, 'kingler': 99,
      'voltorb': 100, 'electrode': 101, 'exeggcute': 102,
      'exeggutor': 103, 'cubone': 104, 'marowak': 105,
      'hitmonlee': 106, 'hitmonchan': 107, 'lickitung': 108,
      'koffing': 109, 'weezing': 110, 'rhyhorn': 111,
      'rhydon': 112, 'chansey': 113, 'tangela': 114,
      'kangaskhan': 115, 'horsea': 116, 'seadra': 117,
      'goldeen': 118, 'seaking': 119, 'staryu': 120,
      'starmie': 121, 'mr-mime': 122, 'scyther': 123,
      'jynx': 124, 'electabuzz': 125, 'magmar': 126,
      'pinsir': 127, 'tauros': 128, 'magikarp': 129,
      'gyarados': 130, 'lapras': 131, 'ditto': 132,
      'eevee': 133, 'vaporeon': 134, 'jolteon': 135,
      'flareon': 136, 'porygon': 137, 'omanyte': 138,
      'omastar': 139, 'kabuto': 140, 'kabutops': 141,
      'aerodactyl': 142, 'snorlax': 143, 'articuno': 144,
      'zapdos': 145, 'moltres': 146, 'dratini': 147,
      'dragonair': 148, 'dragonite': 149, 'mewtwo': 150,
      'mew': 151
    };

    return nameToId[name] || null;
  }
}
