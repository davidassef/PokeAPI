const path = require('path');

module.exports = {
  // Configuração de file watching otimizada
  watchOptions: {
    // Ignorar diretórios que não precisam ser monitorados
    ignored: [
      '**/node_modules/**',
      '**/www/**',
      '**/dist/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/coverage/**',
      '**/.git/**',
      '**/.angular/**',
      '**/logs/**',
      '**/tmp/**',
      '**/temp/**',
      '**/*.log',
      '**/*.tmp',
      '**/*.temp'
    ],

    // Configurações de polling para evitar loops
    // poll: false, // Desabilita polling, usa eventos nativos do sistema (REMOVIDO - causava erro)
    aggregateTimeout: 300, // Aguarda 300ms antes de recompilar

    // Configurações específicas para Windows
    followSymlinks: false,

    // Ignorar arquivos específicos que podem causar loops
    ignored: /node_modules|www|dist|test-results|playwright-report|coverage|\.git|\.angular|logs|tmp|temp|\.log$|\.tmp$|\.temp$/
  },

  // Configuração de cache para melhor performance
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.angular/cache'),
    buildDependencies: {
      config: [__filename]
    }
  },

  // Configuração de resolução de módulos
  resolve: {
    // Evitar resolução desnecessária
    symlinks: false,

    // Cache de resolução
    cache: true,

    // Extensões a serem resolvidas
    extensions: ['.ts', '.js', '.json'],

    // Alias para evitar caminhos longos
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@environments': path.resolve(__dirname, 'src/environments')
    }
  },

  // Configuração de snapshot para evitar rebuilds desnecessários
  snapshot: {
    managedPaths: [path.resolve(__dirname, 'node_modules')],
    immutablePaths: [],
    buildDependencies: {
      hash: true,
      timestamp: true
    },
    module: {
      timestamp: true,
      hash: true
    },
    resolve: {
      timestamp: true,
      hash: true
    },
    resolveBuildDependencies: {
      timestamp: true,
      hash: true
    }
  },

  // Configuração de stats para reduzir logs verbosos
  stats: {
    assets: false,
    children: false,
    chunks: false,
    chunkModules: false,
    colors: true,
    entrypoints: false,
    hash: false,
    modules: false,
    timings: true,
    version: false,
    warnings: true,
    errors: true
  },

  // Configuração de infraestrutura de logging
  infrastructureLogging: {
    level: 'warn',
    debug: false
  }
};
