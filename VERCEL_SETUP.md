# 🚀 Guia para Recriar Projeto no Vercel

## ❌ **Problema Atual**
O erro "redirects", "headers", "idea-URIs" indica que há configurações conflitantes ou caracteres inválidos na integração GitHub + Vercel.

## ✅ **Solução: Recriar Projeto**

### **Passo 1: Deletar Projeto Atual**
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Encontre o projeto `pokeapiapp-frontend`
3. Vá em **Settings** → **Advanced** → **Delete Project**
4. Confirme a exclusão

### **Passo 2: Importar Repositório Novamente**
1. Clique em **"New Project"**
2. Selecione **"Import Git Repository"**
3. Escolha `davidassef/PokeAPI`
4. Clique em **"Import"**

### **Passo 3: Configurar Projeto**
Use EXATAMENTE estas configurações:

```
Framework Preset: Angular
Root Directory: frontend
Build Command: npm run build:vercel
Output Directory: www
Install Command: npm install
```

### **Passo 4: Variáveis de Ambiente**
Adicione se necessário:
```
NODE_ENV=production
```

### **Passo 5: Deploy Settings**
- **Production Branch**: main
- **Auto-deploy**: Enabled
- **Ignore Build Step**: Deixe vazio

## 🔧 **Configurações Atuais do Projeto**

### vercel.json (Simplificado)
```json
{
  "buildCommand": "cd frontend && npm run build:vercel",
  "outputDirectory": "frontend/www",
  "installCommand": "cd frontend && npm install"
}
```

### Build Command (Otimizado)
```bash
ng build --configuration production && cp src/_redirects www/_redirects && cp src/404.html www/404.html
```

## ✅ **Após Recriar**
1. O deploy automático deve funcionar
2. Cada push na branch `main` deve disparar um novo deploy
3. Não haverá mais erros de caracteres inválidos

## 🆘 **Se Ainda Não Funcionar**
1. Verificar se o repositório tem permissões corretas
2. Verificar se não há webhooks duplicados no GitHub
3. Contactar suporte do Vercel se necessário
