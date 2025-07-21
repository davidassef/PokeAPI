# 🤝 Guia de Contribuição - PokeAPI App

Obrigado por considerar contribuir para o **PokeAPI App**! Este documento fornece diretrizes e informações para ajudar você a contribuir de forma efetiva.

## 📋 Índice

- [🚀 Como Começar](#-como-começar)
- [🔧 Configuração do Ambiente](#-configuração-do-ambiente)
- [📝 Tipos de Contribuição](#-tipos-de-contribuição)
- [🌿 Fluxo de Trabalho com Git](#-fluxo-de-trabalho-com-git)
- [📏 Padrões de Código](#-padrões-de-código)
- [🧪 Testes](#-testes)
- [📖 Documentação](#-documentação)
- [🐛 Reportando Bugs](#-reportando-bugs)
- [💡 Sugerindo Melhorias](#-sugerindo-melhorias)
- [👥 Código de Conduta](#-código-de-conduta)

## 🚀 Como Começar

### **Pré-requisitos**
- **Node.js** 18+ e **npm** 9+
- **Python** 3.11+ e **pip**
- **Git** configurado
- **IDE** recomendado: VS Code

### **1. Fork e Clone**
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/PokeAPI.git
cd PokeAPI

# Adicione o repositório original como upstream
git remote add upstream https://github.com/davidassef/PokeAPI.git
```

### **2. Configuração Inicial**
```bash
# Backend (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend (Angular/Ionic)
cd ../frontend
npm install
```

## 🔧 Configuração do Ambiente

### **Backend (FastAPI)**
```bash
cd backend
# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor de desenvolvimento
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend (Angular/Ionic)**
```bash
cd frontend
# Instalar dependências
npm install

# Executar em modo web
npm run start

# Executar em modo mobile (Ionic)
ionic serve
```

## 📝 Tipos de Contribuição

### **🐛 Correção de Bugs**
- Identifique e corrija problemas existentes
- Adicione testes para prevenir regressões
- Documente a correção no commit

### **✨ Novas Funcionalidades**
- Implemente recursos solicitados nas issues
- Siga os padrões de design existentes
- Inclua testes abrangentes
- Atualize a documentação

### **📚 Documentação**
- Melhore README.md, comentários no código
- Adicione exemplos de uso
- Corrija erros de digitação
- Traduza conteúdo

### **🧪 Testes**
- Adicione testes unitários e de integração
- Melhore cobertura de testes
- Corrija testes quebrados

### **🎨 Melhorias de UI/UX**
- Aprimore interface e experiência do usuário
- Otimize responsividade
- Melhore acessibilidade

## 🌿 Fluxo de Trabalho com Git

### **1. Sincronizar com Upstream**
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### **2. Criar Branch para Feature**
```bash
# Use nomes descritivos
git checkout -b feature/sistema-favoritos
git checkout -b fix/correcao-modal-pokemon
git checkout -b docs/atualizacao-readme
```

### **3. Fazer Commits**
```bash
# Commits pequenos e focados
git add .
git commit -m "feat: adiciona sistema de favoritos"

# Seguir padrão de commits convencionais
git commit -m "fix: corrige bug no modal de detalhes"
git commit -m "docs: atualiza documentação da API"
```

### **4. Push e Pull Request**
```bash
git push origin feature/sistema-favoritos
# Abrir Pull Request no GitHub
```

## 📏 Padrões de Código

### **🐍 Backend (Python/FastAPI)**
```python
# Usar type hints
def get_pokemon(pokemon_id: int) -> dict:
    """
    Busca informações de um Pokémon específico.
    
    Args:
        pokemon_id: ID único do Pokémon
        
    Returns:
        dict: Dados do Pokémon
    """
    return pokemon_data

# Seguir PEP 8
# Usar docstrings em funções
# Validação com Pydantic
```

### **🅰️ Frontend (TypeScript/Angular)**
```typescript
// Usar interfaces para tipagem
interface Pokemon {
  id: number;
  name: string;
  types: string[];
}

// Componentes bem estruturados
@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss']
})
export class PokemonCardComponent {
  @Input() pokemon!: Pokemon;
  
  /**
   * Manipula clique no card do Pokémon
   */
  onCardClick(): void {
    // Implementação
  }
}
```

### **📝 Padrão de Commits**
```
tipo(escopo): descrição breve

Descrição mais detalhada se necessário

- feat: nova funcionalidade
- fix: correção de bug
- docs: documentação
- style: formatação
- refactor: refatoração
- test: testes
- chore: tarefas de manutenção
```

## 🧪 Testes

### **Backend**
```bash
# Executar testes
cd backend
pytest

# Testes com cobertura
pytest --cov=app tests/

# Testes específicos
pytest tests/test_pokemon_api.py
```

### **Frontend**
```bash
# Testes unitários
cd frontend
npm run test

# Testes E2E
npm run e2e

# Testes específicos
ng test --include="**/pokemon.component.spec.ts"
```

### **Diretrizes de Teste**
- ✅ Escreva testes para novas funcionalidades
- ✅ Mantenha cobertura de testes > 80%
- ✅ Teste casos de erro e edge cases
- ✅ Use mocks para dependências externas

## 📖 Documentação

### **Comentários no Código**
```python
# ✅ Bom
def calculate_damage(attack: int, defense: int) -> int:
    """
    Calcula dano baseado em ataque e defesa.
    
    Args:
        attack: Valor de ataque do Pokémon
        defense: Valor de defesa do oponente
        
    Returns:
        int: Dano calculado
    """
    return max(1, attack - defense)

# ❌ Evitar
def calc(a, d):  # calcula dano
    return max(1, a - d)
```

### **README e Documentação**
- Mantenha README.md atualizado
- Documente APIs com exemplos
- Inclua screenshots quando relevante
- Explique decisões arquiteturais

## 🐛 Reportando Bugs

### **Template de Bug Report**
```markdown
**Descrição do Bug**
Descrição clara e concisa do problema.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 1.2.0]
```

## 💡 Sugerindo Melhorias

### **Template de Feature Request**
```markdown
**Funcionalidade Solicitada**
Descrição clara da funcionalidade desejada.

**Problema que Resolve**
Explique o problema que esta funcionalidade resolveria.

**Solução Proposta**
Descreva como você imagina que funcione.

**Alternativas Consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Qualquer informação adicional relevante.
```

## 👥 Código de Conduta

### **Nossos Compromissos**
- 🤝 Ser respeitoso e inclusivo
- 💬 Comunicação construtiva
- 🎯 Foco na melhoria do projeto
- 🌟 Reconhecer contribuições de todos

### **Comportamentos Esperados**
- ✅ Linguagem acolhedora e inclusiva
- ✅ Respeito por diferentes pontos de vista
- ✅ Aceitar críticas construtivas
- ✅ Foco no que é melhor para a comunidade

### **Comportamentos Inaceitáveis**
- ❌ Linguagem ou imagens sexualizadas
- ❌ Comentários insultuosos ou depreciativos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas sem permissão

---

## 🙏 Agradecimentos

Obrigado por contribuir para o **PokeAPI App**! Sua ajuda torna este projeto melhor para toda a comunidade.

### **Dúvidas?**
- 📧 Abra uma [issue](https://github.com/davidassef/PokeAPI/issues)
- 💬 Entre em contato: [davidassef@gmail.com](mailto:davidassef@gmail.com)

**Vamos construir algo incrível juntos! 🚀✨**
