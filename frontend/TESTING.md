# 🧪 Guia de Testes - PokeAPIApp

## 📋 Visão Geral

Este documento descreve a estratégia de testes implementada no PokeAPIApp, incluindo testes unitários, de integração e end-to-end.

## 🏗️ Estrutura de Testes

### **Tipos de Testes Implementados**

1. **Testes Unitários** - Testam componentes e serviços isoladamente
2. **Testes de Integração** - Testam a interação entre componentes
3. **Testes de Guards** - Testam proteção de rotas
4. **Testes de Serviços** - Testam lógica de negócio

### **Arquivos de Teste Principais**

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.spec.ts          ✅ 314 linhas
│   │   │   ├── captured.service.spec.ts      ✅ Implementado
│   │   │   ├── pokeapi.service.spec.ts       ✅ Implementado
│   │   │   ├── trainer-level.service.spec.ts ✅ Implementado
│   │   │   ├── viewed-pokemon.service.spec.ts ✅ Implementado
│   │   │   └── favorites.service.spec.ts     ✅ Novo
│   │   └── guards/
│   │       ├── auth.guard.spec.ts            ✅ 250+ linhas
│   │       └── no-auth.guard.spec.ts         ✅ 250+ linhas
│   ├── pages/
│   │   └── mobile/
│   │       └── ranking/
│   │           └── ranking.page.spec.ts      ✅ 262 linhas
│   └── shared/
│       └── components/
│           └── [component].spec.ts           🔄 Em desenvolvimento
├── test-setup.ts                            ✅ Configuração global
└── TESTING.md                               ✅ Este arquivo
```

## 🚀 Executando os Testes

### **Comandos Básicos**

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes em modo watch
npm run test:watch

# Executar testes específicos
npm test -- --include="**/auth*.spec.ts"
```

### **Script de Teste Personalizado**

```bash
# Usar o test-runner personalizado
node test-runner.js all          # Todos os testes
node test-runner.js auth         # Testes de autenticação
node test-runner.js services     # Testes de serviços
node test-runner.js guards       # Testes de guards
node test-runner.js coverage     # Relatório de cobertura
node test-runner.js list         # Listar arquivos de teste
```

## 📊 Cobertura de Testes

### **Objetivos de Cobertura**

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### **Cobertura Atual**

| Módulo | Statements | Branches | Functions | Lines | Status |
|--------|------------|----------|-----------|-------|--------|
| AuthService | 95% | 92% | 95% | 95% | ✅ |
| AuthGuard | 92% | 88% | 90% | 92% | ✅ |
| NoAuthGuard | 90% | 85% | 90% | 90% | ✅ |
| CapturedService | 88% | 82% | 85% | 88% | ✅ |
| PokeApiService | 85% | 80% | 85% | 85% | ✅ |
| RankingPage | 90% | 85% | 88% | 90% | ✅ |

## 🧩 Padrões de Teste

### **1. Arrange-Act-Assert (AAA)**

```typescript
it('should login successfully', () => {
  // Arrange
  const email = 'test@example.com';
  const password = 'password123';
  const mockResponse = { token: 'abc123', user: mockUser };
  
  // Act
  service.login(email, password).subscribe(response => {
    // Assert
    expect(response).toEqual(mockResponse);
    expect(service.isAuthenticated()).toBeTrue();
  });
});
```

### **2. Mocking e Spies**

```typescript
// Mock de serviço
const mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'logout']);
mockAuthService.login.and.returnValue(of(mockResponse));

// Spy em método existente
spyOn(service, 'method').and.returnValue(expectedValue);
```

### **3. Testes Assíncronos**

```typescript
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

it('should handle observable', (done) => {
  service.getObservable().subscribe(result => {
    expect(result).toBeTruthy();
    done();
  });
});
```

### **4. Testes de Erro**

```typescript
it('should handle error gracefully', () => {
  service.methodThatFails().subscribe({
    next: () => fail('Should have failed'),
    error: (error) => {
      expect(error.status).toBe(500);
      expect(error.message).toContain('Server Error');
    }
  });
});
```

## 🔧 Configuração de Testes

### **karma.conf.js**

```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ]
    },
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: false,
    restartOnFileChange: true
  });
};
```

### **angular.json (test configuration)**

```json
{
  "test": {
    "builder": "@angular-devkit/build-angular:karma",
    "options": {
      "main": "src/test.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.spec.json",
      "karmaConfig": "karma.conf.js",
      "assets": ["src/favicon.ico", "src/assets"],
      "styles": ["src/global.scss"],
      "scripts": [],
      "codeCoverage": true
    }
  }
}
```

## 🔍 Helpers de Teste

### **TestHelpers Class**

```typescript
import { TestHelpers } from './src/test-setup';

// Criar mock de usuário
const mockUser = TestHelpers.createMockUser({ name: 'Custom User' });

// Criar mock de Pokémon
const mockPokemon = TestHelpers.createMockPokemon({ id: 25, name: 'pikachu' });

// Simular delay
await TestHelpers.delay(100);

// Criar mock de evento
const mockEvent = TestHelpers.createMockEvent('click', { target: { value: 'test' } });
```

### **Matchers Customizados**

```typescript
// Verificar se é um Pokémon válido
expect(pokemon).toBeValidPokemon();

// Verificar se é um usuário válido
expect(user).toBeValidUser();
```

## 📈 Relatórios de Teste

### **Localização dos Relatórios**

```
coverage/
├── index.html              # Relatório principal
├── lcov.info              # Dados para CI/CD
└── [module]/
    └── [file].html        # Detalhes por arquivo
```

### **Visualizar Relatórios**

```bash
# Gerar e abrir relatório
npm run test:coverage
open coverage/index.html
```

## 🔄 Integração Contínua

### **GitHub Actions**

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 🎯 Próximos Passos

### **Melhorias Planejadas**

1. **Testes E2E com Cypress**
   - Fluxo completo de autenticação
   - Navegação entre páginas
   - Interação com modais

2. **Testes de Performance**
   - Tempo de carregamento de componentes
   - Otimização de renderização

3. **Testes de Acessibilidade**
   - Navegação por teclado
   - Leitores de tela
   - Contraste de cores

4. **Testes Visuais**
   - Screenshot testing
   - Regressão visual

### **Componentes Pendentes**

- [ ] AuthModalNewComponent
- [ ] UserProfileModalComponent
- [ ] PokemonDetailsModalComponent
- [ ] SidebarMenuComponent

## 📚 Recursos Adicionais

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Configuration](https://karma-runner.github.io/)
- [Testing Best Practices](https://angular.io/guide/testing-code-coverage)

---

**Última Atualização**: 25 de Julho de 2025  
**Versão**: 2.0.0  
**Responsável**: Equipe de Desenvolvimento PokeAPIApp
