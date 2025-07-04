import json
import os

def translate_flavors():
    """
    Traduz os flavors do inglês para português brasileiro.
    """
    
    # Carregar flavors em inglês
    with open("backend/app/data/flavors_en.json", "r", encoding="utf-8") as f:
        flavors_en = json.load(f)
    
    # Dicionário de traduções
    translations = {
        # Geração 1 (1-151)
        "1": [
            "Uma semente estranha foi plantada em suas costas ao nascer. A planta brota e cresce com este POKéMON.",
            "Pode ficar dias sem comer uma única migalha. Na bolha em suas costas, ele armazena energia.",
            "A semente em suas costas está cheia de nutrientes. A semente cresce constantemente maior conforme seu corpo cresce.",
            "Ele carrega uma semente em suas costas desde o nascimento. Conforme envelhece, a semente também cresce.",
            "Enquanto é jovem, usa os nutrientes armazenados na semente em suas costas para crescer.",
            "BULBASAUR pode ser visto cochilando na luz do sol. Há uma semente em suas costas. Absorvendo os raios do sol, a semente cresce progressivamente.",
            "Há uma semente de planta em suas costas desde o dia em que este POKéMON nasce. A semente cresce lentamente.",
            "Por algum tempo após seu nascimento, cresce ganhando nutrição da semente em suas costas.",
            "Uma semente estranha foi plantada em suas costas ao nascer. A planta brota e cresce com este Pokémon.",
            "Bulbasaur pode ser visto cochilando na luz do sol. Há uma semente em suas costas. Absorvendo os raios do sol, a semente cresce progressivamente.",
            "Há uma semente de planta em suas costas desde o dia em que este Pokémon nasce. A semente cresce lentamente.",
            "Enquanto é jovem, usa os nutrientes armazenados na semente em suas costas para crescer."
        ],
        "2": [
            "Quando a bolha em suas costas cresce muito, parece perder a capacidade de ficar em pé nas patas traseiras.",
            "A bolha em suas costas cresce absorvendo energia. Emite um aroma quando está pronta para florescer.",
            "Exposição à luz solar aumenta sua força. A luz solar também faz o botão em suas costas crescer.",
            "Se o botão em suas costas começar a cheirar doce, é evidência de que a grande flor logo florescerá.",
            "A bolha em suas costas cresce conforme absorve nutrientes. A bolha emite um aroma agradável quando floresce.",
            "Há um botão nas costas deste POKéMON. Para suportar seu peso, as pernas e tronco do IVYSAUR ficam grossos e fortes. Se começar a passar mais tempo deitado na luz do sol, é sinal de que o botão logo florescerá em uma grande flor.",
            "Para suportar sua bolha, as pernas do Ivysaur ficam resistentes. Se passar mais tempo deitado na luz do sol, o botão logo florescerá em uma grande flor.",
            "Há uma bolha de planta em suas costas. Quando absorve nutrientes, diz-se que a bolha floresce em uma grande flor.",
            "Quando o botão em suas costas começa a inchar, um aroma doce se espalha para indicar a chegada da flor.",
            "Exposição à luz solar aumenta sua força. A luz solar também faz o botão em suas costas crescer.",
            "Há um botão nas costas deste Pokémon. Para suportar seu peso, as pernas e tronco do Ivysaur ficam grossos e fortes. Se começar a passar mais tempo deitado na luz do sol, é sinal de que o botão logo florescerá em uma grande flor.",
            "O botão em suas costas cresce absorvendo energia. Emite um aroma quando está pronto para florescer."
        ],
        "3": [
            "A planta floresce quando está absorvendo energia solar. Fica em movimento para buscar luz solar.",
            "A flor em suas costas captura os raios do sol. A luz solar é então absorvida e usada para energia.",
            "Espalhando as pétalas largas de sua flor e capturando os raios do sol, enche seu corpo com poder.",
            "É capaz de converter luz solar em energia. Como resultado, é mais poderoso no verão.",
            "Conforme se aquece e absorve a luz solar, as pétalas de sua flor liberam uma fragrância agradável.",
            "Há uma grande flor nas costas do VENUSAUR. Diz-se que a flor assume cores vívidas se receber muita nutrição e luz solar. O aroma da flor acalma as emoções das pessoas.",
            "A flor do VENUSAUR diz-se que assume cores vívidas se receber muita nutrição e luz solar. O aroma da flor acalma as emoções das pessoas.",
            "Um aroma hipnotizante se espalha de sua flor. A fragrância acalma aqueles engajados em batalha.",
            "Sua planta floresce quando está absorvendo energia solar. Fica em movimento para buscar luz solar.",
            "Após um dia chuvoso, a flor em suas costas cheira mais forte. O aroma atrai outros Pokémon.",
            "Espalhando as pétalas largas de sua flor e capturando os raios do sol, enche seu corpo com poder.",
            "É capaz de converter luz solar em energia. Como resultado, é mais poderoso no verão.",
            "Há uma grande flor nas costas do Venusaur. Diz-se que a flor assume cores vívidas se receber muita nutrição e luz solar. O aroma da flor acalma as emoções das pessoas.",
            "A flor em suas costas captura os raios do sol. A luz solar é então absorvida e usada para energia."
        ],
        "4": [
            "Obviamente prefere lugares quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.",
            "A chama na ponta de sua cauda faz um som conforme queima. Você só pode ouvi-lo em lugares quietos.",
            "A chama em sua cauda mostra a força de sua força vital. Se está fraco, a chama também queima fracamente.",
            "A chama em sua cauda indica a força vital do CHARMANDER. Se está saudável, a chama queima intensamente.",
            "Se está saudável, a chama na ponta de sua cauda queimará vigorosamente, mesmo se ficar um pouco molhada.",
            "A chama que queima na ponta de sua cauda é uma indicação de suas emoções. A chama oscila quando CHARMANDER está se divertindo. Se o POKéMON ficar enfurecido, a chama queima ferozmente.",
            "A chama que queima na ponta de sua cauda é uma indicação de suas emoções. A chama oscila quando CHARMANDER está feliz, e arde quando está enfurecido.",
            "Desde o momento em que nasce, uma chama queima na ponta de sua cauda. Sua vida terminaria se a chama se apagasse.",
            "Tem preferência por coisas quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.",
            "O fogo na ponta de sua cauda é uma medida de sua vida. Se saudável, sua cauda queima intensamente.",
            "A chama em sua cauda indica a força vital do CHARMANDER. Se está saudável, a chama queima intensamente.",
            "A chama em sua cauda indica a força vital do Charmander. Se está saudável, a chama queima intensamente.",
            "A chama que queima na ponta de sua cauda é uma indicação de suas emoções. A chama oscila quando Charmander está se divertindo. Se o Pokémon ficar enfurecido, a chama queima ferozmente."
        ],
        "5": [
            "Quando balança sua cauda em chamas, eleva a temperatura a níveis insuportavelmente altos.",
            "Lutas difíceis podem excitar este POKéMON. Quando excitado, pode soprar chamas azuladas-brancas.",
            "É muito temperamental por natureza, então constantemente busca oponentes. Só se acalma quando vence.",
            "Tem uma natureza bárbara. Em batalha, chicoteia sua cauda flamejante e corta com garras afiadas.",
            "Se fica agitado durante a batalha, sopra chamas intensas, incinerando seus arredores.",
            "CHARMELEON destrói impiedosamente seus inimigos usando suas garras afiadas. Se encontra um inimigo forte, fica agressivo. Neste estado excitado, a chama na ponta de sua cauda arde com uma cor azulada branca.",
            "Sem piedade, suas garras afiadas destroem inimigos. Se encontra um inimigo forte, fica agitado, e a chama em sua cauda arde com uma cor azulada branca.",
            "Chicoteia com sua cauda para derrubar seu inimigo. Então rasga o oponente caído com garras afiadas.",
            "Quando balança sua cauda em chamas, eleva a temperatura do ar a níveis insuportavelmente altos.",
            "Nas montanhas rochosas onde CHARMELEON vivem, suas caudas flamejantes brilham à noite como estrelas.",
            "É muito temperamental por natureza, então constantemente busca oponentes. Só se acalma quando vence.",
            "Nas montanhas rochosas onde Charmeleon vivem, suas caudas flamejantes brilham à noite como estrelas.",
            "Quando balança sua cauda em chamas, eleva a temperatura do ar a níveis insuportavelmente altos.",
            "Charmeleon destrói impiedosamente seus inimigos usando suas garras afiadas. Se encontra um inimigo forte, fica agressivo. Neste estado excitado, a chama na ponta de sua cauda arde com uma cor azulada branca.",
            "Lutas difíceis podem excitar este Pokémon. Quando excitado, pode soprar chamas azuladas-brancas."
        ],
        "6": [
            "Cospe fogo quente o suficiente para derreter pedregulhos. Conhecido por causar incêndios florestais sem querer.",
            "Quando expulsa uma explosão de fogo super quente, a chama vermelha na ponta de sua cauda queima mais intensamente.",
            "Se CHARIZARD fica furioso, a chama na ponta de sua cauda arde em uma cor azulada-branca.",
            "Respirando chamas intensas e quentes, pode derreter quase qualquer coisa. Seu hálito inflige dor terrível aos inimigos.",
            "Usa suas asas para voar alto. A temperatura de seu fogo aumenta conforme ganha experiência em batalha.",
            "CHARIZARD voa pelo céu em busca de oponentes poderosos. Respira fogo de tão grande calor que derrete qualquer coisa. No entanto, nunca vira seu hálito flamejante para qualquer oponente mais fraco que ele mesmo.",
            "Um CHARIZARD voa em busca de oponentes fortes. Respira chamas intensas que podem derreter qualquer material. No entanto, nunca ateará fogo em um inimigo mais fraco.",
            "Suas asas podem carregar este POKéMON perto de uma altitude de 4.600 pés. Sopra fogo em temperaturas muito altas.",
            "Cospe fogo quente o suficiente para derreter pedregulhos. Pode causar incêndios florestais soprando chamas.",
            "Diz-se que o fogo do CHARIZARD queima mais quente se experimentou batalhas duras.",
            "Se CHARIZARD fica furioso, a chama na ponta de sua cauda arde em uma tonalidade azul clara.",
            "Respirando chamas intensas e quentes, pode derreter quase qualquer coisa. Seu hálito inflige dor terrível aos inimigos.",
            "Diz-se que o fogo do Charizard queima mais quente se experimentou batalhas duras.",
            "Quando expulsa uma explosão de fogo super quente, a chama vermelha na ponta de sua cauda queima mais intensamente.",
            "Suas asas podem carregar este Pokémon perto de uma altitude de 4.600 pés. Sopra fogo em temperaturas muito altas.",
            "Charizard voa pelo céu em busca de oponentes poderosos. Respira fogo de tão grande calor que derrete qualquer coisa. No entanto, nunca vira seu hálito flamejante para qualquer oponente mais fraco que ele mesmo.",
            "Quando este Pokémon expulsa uma explosão de fogo super quente, a chama vermelha na ponta de sua cauda queima mais intensamente."
        ],
        "7": [
            "Após o nascimento, suas costas incham e endurecem em uma concha. Borrifa espuma poderosamente de sua boca.",
            "Atira água na presa enquanto está na água. Retrai-se em sua concha quando em perigo.",
            "A concha é macia quando nasce. Logo se torna tão resiliente que dedos cutucando ricochetearão dela.",
            "A concha, que endurece logo após o nascimento, é resiliente. Se você cutucá-la, ela ricocheteará de volta.",
            "Quando se sente ameaçado, puxa suas pernas para dentro de sua concha e borrifa água de sua boca.",
            "A concha do SQUIRTLE não é usada meramente para proteção. A forma arredondada da concha e os sulcos em sua superfície ajudam a minimizar a resistência na água, permitindo que este POKéMON nade em altas velocidades.",
            "Sua concha não é apenas para proteção. Sua forma arredondada e os sulcos em sua superfície minimizam a resistência na água, permitindo que SQUIRTLE nade em altas velocidades.",
            "Quando retrai seu pescoço longo em sua concha, borrifa água com força vigorosa.",
            "Após o nascimento, suas costas incham e endurecem em uma concha. Borrifa espuma poderosamente de sua boca.",
            "Abriga-se em sua concha, então contra-ataca com jatos de água a cada oportunidade.",
            "A concha é macia quando nasce. Logo se torna tão resiliente que dedos cutucando ricochetearão dela.",
            "Abriga-se em sua concha então contra-ataca com jatos de água a cada oportunidade.",
            "A concha do Squirtle não é usada meramente para proteção. A forma arredondada da concha e os sulcos em sua superfície ajudam a minimizar a resistência na água, permitindo que este Pokémon nade em altas velocidades.",
            "Quando se sente ameaçado, puxa seus membros para dentro de sua concha e borrifa água de sua boca."
        ],
        "8": [
            "Frequentemente se esconde na água para perseguir presas desavisadas. Para nadar rápido, move suas orelhas para manter o equilíbrio.",
            "Quando tocado, este POKéMON puxará sua cabeça, mas sua cauda ainda ficará um pouco para fora.",
            "É reconhecido como um símbolo de longevidade. Se sua concha tem algas, aquele WARTORTLE é muito velho.",
            "Controla inteligentemente suas orelhas peludas e cauda para manter seu equilíbrio enquanto nada.",
            "Sua cauda longa e peluda é um símbolo de longevidade, tornando-o bastante popular entre pessoas mais velhas.",
            "Sua cauda é grande e coberta com uma pelagem rica e grossa. A cauda se torna cada vez mais profunda em cor conforme WARTORTLE envelhece. Os arranhões em sua concha são evidência da resistência deste POKéMON como lutador.",
            "Sua cauda grande é coberta com pelagem rica e grossa que se aprofunda em cor com a idade. Os arranhões em sua concha são evidência da resistência deste POKéMON em batalha.",
            "Este POKéMON é muito popular como animal de estimação. Sua cauda coberta de pelo é um símbolo de sua longevidade.",
            "Frequentemente se esconde na água para perseguir presas desavisadas. Para nadar rápido, move suas orelhas para manter o equilíbrio.",
            "Diz-se que vive 10.000 anos. Sua cauda peluda é popular como símbolo de longevidade.",
            "É um símbolo bem estabelecido de longevidade. Se sua concha tem algas, aquele WARTORTLE é muito velho.",
            "Controla inteligentemente suas orelhas peludas e cauda para manter seu equilíbrio enquanto nada.",
            "Quando tocado, este Pokémon puxará sua cabeça, mas sua cauda ainda ficará um pouco para fora.",
            "Sua cauda é grande e coberta com uma pelagem rica e grossa. A cauda se torna cada vez mais profunda em cor conforme Wartortle envelhece. Os arranhões em sua concha são evidência da resistência deste Pokémon como lutador.",
            "Quando tocado na cabeça, este Pokémon a puxará, mas sua cauda ainda ficará um pouco para fora.",
            "É reconhecido como um símbolo de longevidade. Se sua concha tem algas, aquele Wartortle é muito velho."
        ],
        "9": [
            "Um POKéMON brutal com jatos de água pressurizados em sua concha. São usados para investidas em alta velocidade.",
            "Uma vez que mira em seu inimigo, explode água com ainda mais força que uma mangueira de incêndio.",
            "Deliberadamente se torna pesado para poder suportar o recuo dos jatos de água que dispara.",
            "Os canhões foguete em sua concha disparam jatos de água capazes de fazer buracos através de aço grosso.",
            "Planta firmemente seus pés no chão antes de atirar água dos jatos em suas costas.",
            "BLASTOISE tem bicos de água que se projetam de sua concha. Os bicos de água são muito precisos. Podem atirar balas de água com precisão suficiente para atingir latas vazias de uma distância de mais de 160 pés.",
            "Os bicos de água que se projetam de sua concha são altamente precisos. Suas balas de água podem pregar precisamente latas de uma distância de mais de 160 pés.",
            "Esmaga seu inimigo sob seu corpo pesado para causar desmaio. Em apuros, retrairá dentro de sua concha.",
            "Os jatos de água pressurizados na concha deste POKéMON brutal são usados para investidas em alta velocidade.",
            "Os jatos de água que borrifa dos canhões foguete em sua concha podem fazer buracos através de aço grosso.",
            "Deliberadamente se torna pesado para poder suportar o recuo dos jatos de água que dispara.",
            "Os canhões foguete em sua concha disparam jatos de água capazes de fazer buracos através de aço grosso.",
            "Os jatos de água pressurizados na concha deste Pokémon brutal são usados para investidas em alta velocidade.",
            "Blastoise tem bicos de água que se projetam de sua concha. Os bicos de água são muito precisos. Podem atirar balas de água com precisão suficiente para atingir latas vazias de uma distância de mais de 160 pés."
        ],
        "10": [
            "Seus pés curtos têm pontas com ventosas que permitem que suba incansavelmente encostas e paredes.",
            "Se você tocar o sensor no topo de sua cabeça, ele liberará um fedor horrível para se proteger.",
            "Para proteção, libera um fedor horrível das antenas em sua cabeça para afastar inimigos.",
            "Seus pés têm ventosas projetadas para grudar em qualquer superfície. Trepa tenazmente em árvores para forragear.",
            "Rasteja para a folhagem onde se camufla entre folhas que são da mesma cor que seu corpo.",
            "CATERPIE tem um apetite voraz. Pode devorar folhas maiores que seu corpo diante de seus olhos. De suas antenas, este POKéMON libera um odor terrivelmente forte.",
            "Seu apetite voraz o obriga a devorar folhas maiores que ele mesmo sem hesitação. Libera um odor terrivelmente forte de suas antenas.",
            "É coberto com uma pele verde. Quando cresce, troca a pele, se cobre com seda, e se torna um casulo.",
            "Libera um fedor de suas antenas vermelhas para repelir inimigos. Cresce trocando repetidamente.",
            "Para proteção, libera um fedor horrível das antenas em sua cabeça para afastar inimigos.",
            "Caterpie tem um apetite voraz. Pode devorar folhas maiores que seu corpo diante de seus olhos. De suas antenas, este Pokémon libera um odor terrivelmente forte.",
            "Quando atacado por Pokémon pássaro, resiste liberando um odor terrivelmente forte de suas antenas, mas frequentemente se torna sua presa.",
            "É fácil de capturar, e cresce rapidamente, tornando-o uma das principais recomendações para Treinadores Pokémon novatos.",
            "Talvez porque gostaria de crescer rapidamente, tem um apetite voraz, comendo cem folhas por dia.",
            "Seu corpo é macio e fraco. Na natureza, seu destino perpétuo é ser visto por outros como comida.",
            "Para proteção, libera um fedor horrível das antenas em sua cabeça para afastar inimigos."
        ]
    }
    
    # Criar diretório se não existir
    os.makedirs(os.path.dirname("backend/app/data/flavors_ptbr.json"), exist_ok=True)
    
    # Salvar traduções
    with open("backend/app/data/flavors_ptbr.json", "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)
    
    print("Arquivo de traduções em português criado com sucesso!")
    print(f"Traduzidos {len(translations)} Pokémon")
    print("Arquivo salvo em: backend/app/data/flavors_ptbr.json")

if __name__ == "__main__":
    translate_flavors() 