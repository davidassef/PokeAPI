const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

/**
 * Servidor HTTP do cliente para expor endpoints para o sistema pull-based
 * Este servidor roda junto com o frontend Ionic/Angular
 */
class ClientServer {
  constructor() {
    this.app = express();
    this.port = process.env.CLIENT_PORT || 3001;
    this.syncDataFile = path.join(__dirname, 'client-sync-data.json');

    this.setupMiddleware();
    this.setupRoutes();
    this.loadSyncData();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[ClientServer] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/client/health', (req, res) => {
      res.json({
        status: 'healthy',
        client_id: 'user_1',
        client_url: `http://localhost:${this.port}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Sync data endpoint
    this.app.get('/api/client/sync-data', (req, res) => {
      try {
        const since = req.query.since;
        let captures = this.syncData.captures || [];

        // Filtrar por timestamp se fornecido
        if (since) {
          const sinceDate = new Date(since);
          captures = captures.filter(capture => new Date(capture.timestamp) > sinceDate);
        }

        // Filtrar apenas capturas não sincronizadas
        const pendingCaptures = captures.filter(capture => !capture.synced);

        const response = {
          user_id: 'user_1',
          client_url: `http://localhost:${this.port}`,
          captures: pendingCaptures,
          last_sync: this.syncData.last_sync,
          total_pending: pendingCaptures.length
        };

        console.log(`[ClientServer] Retornando ${pendingCaptures.length} capturas pendentes`);
        res.json(response);
      } catch (error) {
        console.error('[ClientServer] Erro ao obter dados de sync:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Acknowledge endpoint
    this.app.post('/api/client/acknowledge', (req, res) => {
      try {
        const { capture_ids } = req.body;

        if (!capture_ids || !Array.isArray(capture_ids)) {
          return res.status(400).json({ error: 'capture_ids é obrigatório' });
        }

        // Marcar capturas como sincronizadas
        this.syncData.captures = this.syncData.captures.map(capture => {
          if (capture_ids.includes(capture.capture_id)) {
            return { ...capture, synced: true };
          }
          return capture;
        });

        this.syncData.last_sync = new Date().toISOString();
        this.saveSyncData();

        console.log(`[ClientServer] Marcadas ${capture_ids.length} capturas como sincronizadas`);
        res.json({
          message: 'Captures acknowledged successfully',
          count: capture_ids.length
        });
      } catch (error) {
        console.error('[ClientServer] Erro ao confirmar sync:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Stats endpoint
    this.app.get('/api/client/stats', (req, res) => {
      try {
        const captures = this.syncData.captures || [];
        const stats = {
          total_captures: captures.length,
          pending_sync: captures.filter(c => !c.synced).length,
          synced_captures: captures.filter(c => c.synced).length,
          last_sync: this.syncData.last_sync,
          client_id: 'user_1'
        };

        res.json(stats);
      } catch (error) {
        console.error('[ClientServer] Erro ao obter stats:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Endpoint para adicionar capturas (usado pelo frontend)
    this.app.post('/api/client/add-capture', (req, res) => {
      try {
        const { pokemon_id, pokemon_name, action, removed } = req.body;

        // Verificar se já existe uma captura similar recente (evitar duplicação)
        const existingCapture = this.syncData.captures.find(c =>
          c.pokemon_id === parseInt(pokemon_id) &&
          c.action === action &&
          c.metadata.removed === (removed || false) &&
          !c.synced && // Apenas não sincronizadas
          (Date.now() - new Date(c.timestamp).getTime()) < 5000 // Menos de 5 segundos
        );

        if (existingCapture) {
          console.log('[ClientServer] ⚠️  Captura duplicada detectada e ignorada:', { pokemon_id, action, removed });
          return res.json({
            message: 'Duplicate capture ignored',
            capture: existingCapture,
            duplicated: true
          });
        }

        const captureData = {
          capture_id: `${pokemon_id}_${Date.now()}_${action}`,
          pokemon_id: parseInt(pokemon_id),
          pokemon_name: pokemon_name,
          action: action || 'capture',
          timestamp: new Date().toISOString(),
          user_id: 'user_1',
          synced: false,
          metadata: {
            removed: removed || false,
            client_version: '1.0.0'
          }
        };

        this.syncData.captures.push(captureData);
        this.saveSyncData();

        console.log('[ClientServer] ✅ Captura adicionada:', captureData);
        res.json({ message: 'Capture added successfully', capture: captureData });
      } catch (error) {
        console.error('[ClientServer] Erro ao adicionar captura:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // All captures endpoint (para sincronização completa)
    this.app.get('/api/client/all-captures', (req, res) => {
      try {
        const captures = this.syncData.captures || [];

        const response = {
          user_id: 'user_1',
          client_url: `http://localhost:${this.port}`,
          captures: captures, // Todas as capturas, não apenas pendentes
          last_sync: this.syncData.last_sync,
          total_captures: captures.length
        };

        console.log(`[ClientServer] Retornando ${captures.length} capturas totais para sincronização completa`);
        res.json(response);
      } catch (error) {
        console.error('[ClientServer] Erro ao obter todas as capturas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Endpoint para forçar reload dos dados
    this.app.post('/api/client/reload-data', (req, res) => {
      try {
        console.log('[ClientServer] 🔄 Forçando reload dos dados...');
        this.loadSyncData();

        const response = {
          message: 'Dados recarregados com sucesso',
          total_captures: this.syncData.captures.length,
          last_sync: this.syncData.last_sync
        };

        console.log('[ClientServer] ✅ Reload concluído:', response);
        res.json(response);
      } catch (error) {
        console.error('[ClientServer] Erro ao recarregar dados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });
  }

  loadSyncData() {
    try {
      if (fs.existsSync(this.syncDataFile)) {
        const data = fs.readFileSync(this.syncDataFile, 'utf8');
        this.syncData = JSON.parse(data);
      } else {
        this.syncData = {
          captures: [],
          last_sync: null
        };
      }
    } catch (error) {
      console.error('[ClientServer] Erro ao carregar dados de sync:', error);
      this.syncData = {
        captures: [],
        last_sync: null
      };
    }
  }

  saveSyncData() {
    try {
      fs.writeFileSync(this.syncDataFile, JSON.stringify(this.syncData, null, 2));
    } catch (error) {
      console.error('[ClientServer] Erro ao salvar dados de sync:', error);
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`[ClientServer] Servidor do cliente executando na porta ${this.port}`);
      console.log(`[ClientServer] Health check: http://localhost:${this.port}/api/client/health`);
      console.log(`[ClientServer] Sync data: http://localhost:${this.port}/api/client/sync-data`);

      // Registrar com o backend
      this.registerWithBackend();
    });
  }

  async registerWithBackend() {
    try {
      // Importar fetch dinamicamente
      const fetch = await import('node-fetch').then(m => m.default);

      const registrationData = {
        client_url: `http://localhost:${this.port}`,
        user_id: 'user_1',
        client_type: 'web',
        capabilities: ['capture', 'favorite']
      };

      const response = await fetch('http://localhost:8000/api/v1/pull-sync/register-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        console.log('[ClientServer] Cliente registrado com sucesso no backend');
      } else {
        console.warn('[ClientServer] Falha ao registrar cliente no backend:', response.status);
      }
    } catch (error) {
      console.error('[ClientServer] Erro ao registrar cliente:', error);
    }
  }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
  const server = new ClientServer();
  server.start();
}

module.exports = ClientServer;
