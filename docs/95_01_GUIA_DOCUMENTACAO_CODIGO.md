# 📚 Guia de Documentação de Código - PokeAPIApp v1.5.4

## 📋 Visão Geral

Este documento estabelece as diretrizes para manter a documentação de código (docstrings) atualizada e consistente em todo o projeto PokeAPIApp.

## 🎯 Objetivos

- **Padronização**: Garantir consistência nas docstrings
- **Clareza**: Facilitar compreensão do código
- **Manutenibilidade**: Reduzir tempo de onboarding de novos desenvolvedores
- **Qualidade**: Seguir padrões Google-style para Python

## 📝 Padrão de Docstring

### Estilo Google

Todas as funções, classes e métodos devem seguir o padrão Google-style:

```python
def nome_da_funcao(param1: str, param2: int = 0) -> Dict[str, Any]:
    """Descrição breve e clara da função.
    
    Descrição mais detalhada quando necessário, explicando
    o propósito e comportamento da função.
    
    Args:
        param1: Descrição do primeiro parâmetro
        param2: Descrição do segundo parâmetro (opcional)
        
    Returns:
        Dict[str, Any]: Descrição do retorno com tipo
        
    Raises:
        ValueError: Quando param1 está vazio
        HTTPException: Quando há erro de conexão
        
    Example:
        >>> resultado = nome_da_funcao("teste", 42)
        >>> print(resultado["status"])  # "success"
    """
```

## 🏗️ Estrutura dos Arquivos Documentados

### Backend (Python/FastAPI)

#### ✅ Atualizados com Docstrings
- `app/schemas/auth.py` - Schemas de autenticação
- `app/schemas/pokemon_management_schemas.py` - Schemas de Pokémon
- `app/utils/rate_limiter.py` - Limitador de taxa
- `app/schemas/__init__.py` - Documentação do pacote
- `app/utils/__init__.py` - Documentação do pacote

#### 📋 Próximos para Atualização
- `app/routes/` - Rotas da API
- `app/services/` - Serviços de negócio
- `app/models/` - Modelos SQLAlchemy
- `app/core/` - Configurações e core

## 🔄 Processo de Atualização

### 1. Verificação de Documentação
```bash
# Verificar docstrings faltantes
python -m pydocstyle backend/app/ --convention=google

# Verificar tipos de retorno
python -m mypy backend/app/ --ignore-missing-imports
```

### 2. Ferramentas de Validação
- **pydocstyle**: Verifica estilo de docstrings
- **mypy**: Verifica type hints
- **black**: Formatação de código
- **flake8**: Linting geral

### 3. Checklist de Qualidade

#### Para Funções
- [ ] Descrição clara da finalidade
- [ ] Todos os parâmetros documentados
- [ ] Tipo de retorno especificado
- [ ] Exceções possíveis listadas
- [ ] Exemplo de uso quando aplicável

#### Para Classes
- [ ] Descrição da classe e seu propósito
- [ ] Atributos principais documentados
- [ ] Métodos com docstrings completas
- [ ] Exemplos de uso da classe

#### Para Schemas (Pydantic)
- [ ] Descrição do schema e uso
- [ ] Todos os campos documentados
- [ ] Validações customizadas explicadas
- [ ] Exemplo de JSON válido
- [ ] Exemplo de criação do objeto

## 📊 Estatísticas Atuais

### Backend (Python)
- **Arquivos com docstrings completas**: 5/25 (20%)
- **Schemas documentados**: 8/12 (67%)
- **Utilitários documentados**: 2/8 (25%)
- **Rotas documentadas**: 0/15 (0%)

### Progresso por Categoria
- ✅ Schemas: 67% completo
- ✅ Utilitários: 25% completo
- 🔄 Rotas: 0% (próxima fase)
- 🔄 Serviços: 0% (fase subsequente)

## 🛠️ Ferramentas de Desenvolvimento

### Configuração do Ambiente
```bash
# Instalar ferramentas de documentação
pip install pydocstyle mypy black flake8

# Configurar pre-commit hooks
cp backend/.pre-commit-config.yaml.example backend/.pre-commit-config.yaml
```

### Comandos Úteis
```bash
# Verificar documentação
python -m pydocstyle backend/app/

# Verificar type hints
python -m mypy backend/app/ --ignore-missing-imports

# Formatar código
python -m black backend/app/

# Verificar linting
python -m flake8 backend/app/
```

## 🎯 Diretrizes para Contribuidores

### Ao Adicionar Nova Função
1. **Sempre** incluir docstring Google-style
2. **Sempre** especificar tipos de parâmetros e retorno
3. **Sempre** incluir exemplo de uso quando não for óbvio
4. **Sempre** listar exceções possíveis

### Ao Atualizar Função Existente
1. **Verificar** se a docstring está atualizada
2. **Atualizar** exemplos se a API mudou
3. **Revisar** tipos de parâmetros e retorno
4. **Testar** exemplos fornecidos

### Code Review Checklist
- [ ] Todas as funções têm docstrings?
- [ ] Type hints estão corretos?
- [ ] Exemplos são executáveis?
- [ ] Exceções estão documentadas?
- [ ] A documentação está clara?

## 📚 Recursos Adicionais

### Links Úteis
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

### Templates

#### Template para Função
```python
def funcao_exemplo(param1: str, param2: int = 0) -> Dict[str, Any]:
    """Breve descrição da função.
    
    Descrição mais detalhada se necessário.
    
    Args:
        param1: Descrição do parâmetro
        param2: Descrição do parâmetro opcional
        
    Returns:
        Dict[str, Any]: Descrição do retorno
        
    Raises:
        ValueError: Quando param1 é inválido
        
    Example:
        >>> resultado = funcao_exemplo("teste", 42)
        >>> print(resultado["status"])
    """
```

#### Template para Classe Pydantic
```python
class SchemaExemplo(BaseModel):
    """Schema para exemplo de uso.
    
    Este schema é usado para [descrever uso específico].
    
    Attributes:
        campo1: Descrição do campo (ex: "exemplo@email.com")
        campo2: Descrição do campo (ex: 42)
        
    Example:
        >>> schema = SchemaExemplo(
        ...     campo1="teste",
        ...     campo2=123
        ... )
        >>> print(schema.campo1)
    """
    
    campo1: str = Field(..., description="Descrição do campo")
    campo2: int = Field(0, description="Descrição do campo com default")
```

## 🔄 Manutenção Contínua

### Revisões Mensais
- Verificar docstrings desatualizadas
- Atualizar exemplos se API mudou
- Revisar novas funções sem documentação
- Atualizar estatísticas de progresso

### Ferramentas Automatizadas
- Configurar CI/CD para verificar documentação
- Implementar pre-commit hooks
- Configurar alertas para funções sem docstrings

---

**📅 Última atualização**: 28 de Julho de 2025  
**📊 Status**: Documentação em progresso contínuo  
**🎯 Próxima revisão**: 28 de Agosto de 2025