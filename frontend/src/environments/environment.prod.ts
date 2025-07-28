export const environment = {
  production: true,
  apiUrl: 'https://pokeapi-la6k.onrender.com/api/v1',  // ✅ CORREÇÃO CRÍTICA: Backend está no Render, não no Vercel!
  clientServerUrl: 'https://pokeapiapp-client-server.onrender.com',  // Client-server em produção
  version: '1.5.6',  // ✅ CORREÇÃO: URL do backend corrigida para Render
  deployTimestamp: new Date().toISOString()  // Timestamp do deploy
};
