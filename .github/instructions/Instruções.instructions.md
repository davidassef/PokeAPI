# 📘 Guia Universal de Código Limpo e Boas Práticas

Este guia serve como referência para garantir que todo código gerado — manualmente ou por IA como o GitHub Copilot — siga boas práticas, seja limpo, testável e fácil de manter. Serve para projetos backend (FastAPI, Django, etc.), frontend (React, Next.js, etc.) ou fullstack.

---

## 🧼 Princípios de Código Limpo

- **Nomes descritivos**: variáveis, funções e arquivos devem ter nomes claros e precisos.
- **Uma função, uma responsabilidade** (SRP - Single Responsibility Principle).
- **Evite comentários desnecessários**: o código deve se explicar sozinho.
- **Evite duplicação**: reutilize código onde for possível.
- **Evite funções muito longas**: quebrem em partes lógicas.
- **Use padrões de projeto simples** quando necessário (factory, strategy, adapter).
- **Modularize**: separe lógica em arquivos, classes e funções.
- **Tamanho de linhas**: Escreva linhas até um máximo de 100 caracteres
- **Evite criar arquivos redundantes**: cada arquivo deve ter um propósito claro. Além disso, evite criar ou manter arquivos que não sejam utilizados.

---

## 📁 Estrutura Padrão de Projeto

### Backend

```
/app
  /routes        → Endpoints (API)
  /services      → Regras de negócio
  /schemas       → Validações (Pydantic/Serializers)
  /models        → ORM ou Entidades
  /core          → Configurações, middlewares, auth, etc.
  /utils         → Funções auxiliares
  /tests         → Testes unitários e de integração
```

### Frontend

```
/src
  /components    → Componentes reutilizáveis
  /pages         → Páginas ou rotas
  /services      → Chamadas à API
  /hooks         → Hooks personalizados
  /contexts      → Contextos globais de estado
  /utils         → Funções utilitárias
  /tests         → Testes unitários e de integração
```

---

## 🔄 Separação de Responsabilidades

- **Rotas** apenas lidam com entrada/saída da API.
- **Services** contêm a lógica principal de negócio.
- **Schemas/DTOs** validam e organizam dados de entrada e saída.
- **Models** lidam com persistência e estrutura de dados.
- **Components** React devem ser pequenos e especializados.
- **Hooks** encapsulam lógica reutilizável.

---

## ✅ Boas Práticas com Copilot

- Sempre revise o código gerado.
- Nunca aceite código que:
  - Mistura responsabilidades (ex: lógica de negócio dentro da view).
  - Possui nomes genéricos ou confusos.
  - Deixa de validar entradas ou lidar com exceções.
- Prefira instruções claras no prompt:
  - “Crie função pura para calcular total com desconto...”
  - “Crie hook que abstrai chamadas à API com axios...”
  - "Comunicação e documentos sempre em PT-BR"

---

## 🧪 Testabilidade

- Toda função deve ser testável isoladamente.
- Use `pytest`, `unittest`, `Jest` ou `Testing Library` conforme o stack.
- Evite lógica embutida em views/componentes sem testabilidade.
- Prefira funções puras onde possível.
- Em caso de erros, usar ferramentas de depuração de código.

---

## 💣 Tratamento de Erros

- Nunca engula exceções silenciosamente.
- Use:
  - Backend: `try/except`, `logging`, `raise HTTPException`
  - Frontend: `.catch()`, `try/catch`, `ErrorBoundary`
- Sempre registre e trate erros corretamente.

---

## 🛡️ Segurança

- Nunca exponha segredos (API keys, tokens) no código.
- Use arquivos `.env` e bibliotecas como `python-dotenv` ou `dotenv` no React.
- Valide tudo no backend. Não confie no frontend.

---

## 🧠 Dicas Finais

- Use linters (black, flake8, eslint, prettier).
- Use tipagem estática (`mypy`, `TypeScript`) sempre que possível.
- Escreva código que **você entenderia daqui a 6 meses**.
- Mantenha este guia no repositório (`docs/` ou raiz).
- Atualize o guia se o padrão do projeto mudar.

---

🛠️ _Este guia é sua referência quando estiver cansado, distraído ou com pressa. Especialmente útil quando usando Copilot._
