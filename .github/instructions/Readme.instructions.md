
# Projeto PokeAPI - Aplicativo Ionic com Angular

## Descrição
Este projeto é um aplicativo mobile desenvolvido com Ionic e Angular, que consome a API pública [PokeAPI](https://pokeapi.co/). O app exibe uma lista paginada de Pokémons, permite visualizar detalhes completos de cada um, e gerenciar uma lista de favoritos.

## Estrutura do Projeto
- **src/app/pages/home**: Tela principal com lista paginada de Pokémons (nome e imagem).
- **src/app/pages/details**: Tela de detalhes com informações adicionais e imagens do Pokémon selecionado.
- **src/app/services**: Serviços para comunicação com a API e gerenciamento de favoritos.
- **src/app/components**: Componentes reutilizáveis como cards, botões, etc.
- **src/app/models**: Interfaces e tipos para as entidades do app (ex: Pokémon, descrição).
- **src/assets**: Imagens, vídeos e mídias usadas no app.

## Funcionalidades Implementadas
- Listagem paginada dos Pokémons.
- Navegação entre tela principal e detalhes.
- Exibição de no mínimo 6 descrições/imagens na tela de detalhes.
- Marcação e visualização de Pokémons favoritos.
- Layout responsivo para retrato e paisagem.
- Uso de injeção de dependência para serviços.
- Commits frequentes e claros documentando progresso.

## Abordagem Técnica
- Arquitetura modular, separando lógica de UI, serviços e modelos.
- Uso do Angular Reactive Forms e Observables para consumo da API.
- Paginação implementada para otimizar performance e usabilidade.
- Armazenamento local para lista de favoritos via Storage do Ionic.
- Tratamento de erros para garantir experiência estável ao usuário.
- Código comentado e padronizado seguindo o Angular Style Guide.

## Boas Práticas
- Commits pequenos e frequentes com mensagens descritivas.
- Utilização de TypeScript para tipagem forte.
- Componentes desacoplados e reutilizáveis.
- Responsividade garantida com CSS Flexbox e Grid.
- Manutenção da consistência visual e UX.

## Como Rodar o Projeto
1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o app:
   ```bash
   ionic serve
   ```
4. Para testar no dispositivo móvel:
   ```bash
   ionic capacitor run android
   ```
   ou
   ```bash
   ionic capacitor run ios
   ```

## Possíveis Melhorias e Diferenciais
- Adição de testes unitários para componentes e serviços.
- Implementação de WebHooks para atualizações em tempo real.
- Documentação técnica detalhada em Markdown.
- Inclusão de mídia demonstrativa (vídeos, GIFs).
- Melhorias na interface com animações e transições.

---

**Este README será atualizado conforme o progresso do projeto.**
