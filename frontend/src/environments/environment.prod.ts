export const environment = {
  production: true,
  apiUrl: 'https://pokeapi-la6k.onrender.com',  // Backend em produção
  clientServerUrl: 'https://pokeapiapp-client-server.onrender.com',  // Client-server em produção
  version: '1.5.4',  // Build fix: test-setup.ts removido com sucesso
  deployTimestamp: new Date().toISOString()  // Timestamp do deploy
};
