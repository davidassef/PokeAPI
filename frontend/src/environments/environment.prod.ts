export const environment = {
  production: true,
  apiUrl: 'https://poke-api-mauve.vercel.app/api/v1',  // ✅ CORREÇÃO: URL correta do backend Vercel
  clientServerUrl: 'https://pokeapiapp-client-server.onrender.com',  // Client-server em produção
  version: '1.5.5',  // ✅ CORREÇÃO: URL da API corrigida para Vercel
  deployTimestamp: new Date().toISOString()  // Timestamp do deploy
};
