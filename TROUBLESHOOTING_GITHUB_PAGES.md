# 🔧 Troubleshooting GitHub Pages - Erro 404

## 🚨 Problema
- URL https://davidassef.github.io/PokeAPI/ retorna erro 404
- Mensagem: "There isn't a GitHub Pages site here"

## 🔍 Diagnóstico
O GitHub Pages não foi configurado corretamente no repositório.

## 🛠️ Solução Passo a Passo

### **ETAPA 1: Verificar Workflow**
1. Vá para https://github.com/davidassef/PokeAPI/actions
2. Verifique se o workflow "Deploy to GitHub Pages" está sendo executado
3. Se houver erro, leia os logs para identificar o problema

### **ETAPA 2: Configurar GitHub Pages Manualmente**
1. Vá para https://github.com/davidassef/PokeAPI/settings/pages
2. Em **Source**, você deve ver uma dessas opções:

#### **OPÇÃO A: GitHub Actions está disponível**
- Selecione "GitHub Actions"
- O workflow já está configurado
- Aguarde a próxima execução

#### **OPÇÃO B: GitHub Actions NÃO está disponível**
- Selecione "Deploy from a branch"
- Branch: `main`
- Folder: `/ (root)`
- Clique em "Save"
- **AGUARDE 5 MINUTOS**
- Retorne à página e selecione "GitHub Actions"

### **ETAPA 3: Configurar Permissões**
1. Vá para https://github.com/davidassef/PokeAPI/settings/actions
2. Clique em "General"
3. Em "Workflow permissions":
   - ☑️ Marque "Read and write permissions"
   - ☑️ Marque "Allow GitHub Actions to create and approve pull requests"
4. Clique em "Save"

### **ETAPA 4: Forçar Nova Execução**
1. Vá para https://github.com/davidassef/PokeAPI/actions
2. Clique no workflow mais recente
3. Clique em "Re-run all jobs"

### **ETAPA 5: Verificar Ambiente**
1. Vá para https://github.com/davidassef/PokeAPI/deployments
2. Deve aparecer um ambiente chamado "github-pages"
3. Status deve ser "Active"

## 🔄 Alternativa: Deploy Manual

Se o GitHub Actions não funcionar, você pode fazer deploy manual:

```bash
# 1. Fazer build local
cd frontend
npm run build:prod

# 2. Criar branch gh-pages
git checkout --orphan gh-pages
git rm -rf .
cp -r www/* .
git add -A
git commit -m "Deploy manual GitHub Pages"
git push origin gh-pages

# 3. Configurar GitHub Pages para usar branch gh-pages
# Vá para Settings > Pages
# Source: Deploy from a branch
# Branch: gh-pages
# Folder: / (root)
```

## 🧪 Teste Rápido

Após configurar, teste os seguintes endpoints:

1. **Página Principal**: https://davidassef.github.io/PokeAPI/
2. **Roteamento SPA**: https://davidassef.github.io/PokeAPI/home
3. **Assets**: https://davidassef.github.io/PokeAPI/assets/img/pokeball.png

## 📞 Contato de Suporte

Se o problema persistir:
1. Verifique os logs do workflow no GitHub Actions
2. Confirme que o repositório é público
3. Verifique se o nome do repositório está correto
4. Aguarde até 10 minutos para propagação DNS

---

## 🎯 Checklist de Verificação

- [ ] Repositório é público
- [ ] GitHub Pages está habilitado
- [ ] Source está configurado (GitHub Actions ou branch)
- [ ] Permissões do workflow estão corretas
- [ ] Workflow executou sem erros
- [ ] Ambiente github-pages está ativo
- [ ] URL responde (pode levar até 10 minutos)

**🚀 Assim que todos os itens estiverem marcados, a aplicação estará online!**
