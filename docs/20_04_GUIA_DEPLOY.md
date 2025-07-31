# 🚀 Guia de Deploy - PokeAPI Frontend

## 📋 Configuração do Deploy Automático

### Vercel Configuration
- **Framework**: Angular
- **Build Command**: `cd frontend && npm run build:vercel`
- **Output Directory**: `frontend/www`
- **Install Command**: `cd frontend && npm install`

### Arquivos de Configuração
- `vercel.json` - Configuração principal do Vercel
- `.vercelignore` - Arquivos ignorados no deploy
- `.github/vercel.yml` - Configuração GitHub + Vercel

### Scripts Disponíveis
```bash
# Build para produção (Vercel)
npm run build:vercel

# Deploy manual (se necessário)
npm run deploy:vercel
```

## 🔧 Troubleshooting

### Deploy não está funcionando automaticamente?
1. Verificar se o webhook do GitHub está configurado
2. Verificar se há erros no build
3. Verificar se as configurações do Vercel estão corretas

### Como forçar um novo deploy?
1. Fazer uma pequena alteração no código
2. Commit e push para a branch main
3. O Vercel deve detectar automaticamente

### Logs de Deploy
- Acessar o dashboard do Vercel
- Verificar os logs de build
- Verificar se há erros de configuração

## 📊 Status Atual
- **Versão**: 1.5.3
- **Última atualização**: ${new Date().toISOString()}
- **Deploy automático**: Configurado ✅
