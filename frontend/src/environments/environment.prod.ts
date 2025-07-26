export const environment = {
  production: true,
  apiUrl: 'https://pokeapi-la6k.onrender.com',  // Backend em produção
  clientServerUrl: 'https://pokeapiapp-client-server.onrender.com',  // Client-server em produção
  version: '1.5.3',  // Versão para forçar deploy automático
  deployTimestamp: new Date().toISOString()  // Timestamp do deploy
};
