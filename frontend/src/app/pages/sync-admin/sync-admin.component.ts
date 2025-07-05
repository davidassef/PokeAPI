import { Component, OnInit } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { PullSyncControlService } from '../../core/services/pull-sync-control.service';
import { SyncConfigService } from '../../core/services/sync-config.service';

@Component({
  selector: 'app-sync-admin',
  templateUrl: './sync-admin.component.html',
  styleUrls: ['./sync-admin.component.scss']
})
export class SyncAdminComponent implements OnInit {

  pullSyncStatus: any = null;
  schedulerStatus: any = null;
  registeredClients: any[] = [];
  databaseStatus: any = null;

  loading = false;
  autoRefresh = true;
  refreshInterval: any;

  constructor(
    private pullSyncControl: PullSyncControlService,
    private syncConfig: SyncConfigService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadAllStatus();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Carrega todos os status
   */
  async loadAllStatus() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadPullSyncStatus(),
        this.loadSchedulerStatus(),
        this.loadRegisteredClients(),
        this.loadDatabaseStatus()
      ]);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadPullSyncStatus() {
    try {
      this.pullSyncStatus = await this.pullSyncControl.getPullSyncStatus().toPromise();
    } catch (error) {
      console.error('Erro ao carregar status pull-sync:', error);
    }
  }

  async loadSchedulerStatus() {
    try {
      this.schedulerStatus = await this.pullSyncControl.getSchedulerStatus().toPromise();
    } catch (error) {
      console.error('Erro ao carregar status scheduler:', error);
    }
  }

  async loadRegisteredClients() {
    try {
      this.registeredClients = await this.pullSyncControl.getRegisteredClients().toPromise();
    } catch (error) {
      console.error('Erro ao carregar clientes registrados:', error);
    }
  }

  async loadDatabaseStatus() {
    try {
      this.databaseStatus = await this.pullSyncControl.getDatabaseStatus().toPromise();
    } catch (error) {
      console.error('Erro ao carregar status do banco:', error);
    }
  }

  /**
   * Ações de sincronização
   */
  async forceSyncAll() {
    this.loading = true;
    try {
      const result = await this.pullSyncControl.forceSyncAll().toPromise();
      await this.showToast('Sincronização completa executada com sucesso!', 'success');
      await this.loadAllStatus();
      console.log('Resultado da sincronização:', result);
    } catch (error) {
      await this.showToast('Erro ao executar sincronização completa', 'danger');
      console.error('Erro na sincronização:', error);
    } finally {
      this.loading = false;
    }
  }

  async forceSyncRecent() {
    this.loading = true;
    try {
      const result = await this.pullSyncControl.forceSyncRecent().toPromise();
      await this.showToast('Sincronização de mudanças recentes executada!', 'success');
      await this.loadAllStatus();
      console.log('Resultado da sincronização recente:', result);
    } catch (error) {
      await this.showToast('Erro ao executar sincronização recente', 'danger');
      console.error('Erro na sincronização recente:', error);
    } finally {
      this.loading = false;
    }
  }

  async startBackgroundSync() {
    this.loading = true;
    try {
      const result = await this.pullSyncControl.startBackgroundSync().toPromise();
      await this.showToast('Sincronização em background iniciada!', 'success');
      console.log('Sincronização em background:', result);
    } catch (error) {
      await this.showToast('Erro ao iniciar sincronização em background', 'danger');
      console.error('Erro na sincronização em background:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Controle do scheduler
   */
  async startScheduler() {
    this.loading = true;
    try {
      await this.pullSyncControl.startScheduler().toPromise();
      await this.showToast('Scheduler iniciado com sucesso!', 'success');
      await this.loadSchedulerStatus();
    } catch (error) {
      await this.showToast('Erro ao iniciar scheduler', 'danger');
      console.error('Erro ao iniciar scheduler:', error);
    } finally {
      this.loading = false;
    }
  }

  async stopScheduler() {
    this.loading = true;
    try {
      await this.pullSyncControl.stopScheduler().toPromise();
      await this.showToast('Scheduler parado com sucesso!', 'warning');
      await this.loadSchedulerStatus();
    } catch (error) {
      await this.showToast('Erro ao parar scheduler', 'danger');
      console.error('Erro ao parar scheduler:', error);
    } finally {
      this.loading = false;
    }
  }

  async setSchedulerInterval(interval: number) {
    this.loading = true;
    try {
      await this.pullSyncControl.setSchedulerInterval(interval).toPromise();
      await this.showToast(`Intervalo alterado para ${interval} segundos!`, 'success');
      await this.loadSchedulerStatus();
    } catch (error) {
      await this.showToast('Erro ao alterar intervalo', 'danger');
      console.error('Erro ao alterar intervalo:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Limpeza
   */
  async cleanupInactiveClients() {
    this.loading = true;
    try {
      const result = await this.pullSyncControl.cleanupInactiveClients().toPromise();
      await this.showToast('Limpeza de clientes inativos concluída!', 'success');
      await this.loadRegisteredClients();
      console.log('Resultado da limpeza:', result);
    } catch (error) {
      await this.showToast('Erro na limpeza de clientes', 'danger');
      console.error('Erro na limpeza:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Testes
   */
  async runFullSyncTest() {
    this.loading = true;
    try {
      const result = await this.pullSyncControl.runFullSyncTest();
      if (result.success) {
        await this.showToast('Teste completo executado com sucesso!', 'success');
      } else {
        await this.showToast('Erro no teste completo', 'danger');
      }
      await this.loadAllStatus();
      console.log('Resultado do teste:', result);
    } catch (error) {
      await this.showToast('Erro ao executar teste', 'danger');
      console.error('Erro no teste:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Registro de cliente
   */
  async registerClient() {
    const clientUrl = this.syncConfig.getClientServerUrl();
    this.loading = true;
    try {
      await this.pullSyncControl.registerClient(clientUrl).toPromise();
      await this.showToast('Cliente registrado com sucesso!', 'success');
      await this.loadRegisteredClients();
    } catch (error) {
      await this.showToast('Erro ao registrar cliente', 'danger');
      console.error('Erro ao registrar cliente:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Ações administrativas perigosas
   */
  async resetDatabase() {
    const alert = await this.alertController.create({
      header: 'Confirmar Reset',
      message: 'ATENÇÃO: Esta operação irá apagar TODOS os dados do banco de dados. Esta ação é irreversível!',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'RESET',
          handler: async () => {
            this.loading = true;
            try {
              await this.pullSyncControl.resetDatabase().toPromise();
              await this.showToast('Banco de dados resetado!', 'warning');
              await this.loadDatabaseStatus();
            } catch (error) {
              await this.showToast('Erro ao resetar banco', 'danger');
              console.error('Erro ao resetar banco:', error);
            } finally {
              this.loading = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Auto-refresh
   */
  startAutoRefresh() {
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.loadAllStatus();
      }, 10000); // Atualizar a cada 10 segundos
    }
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Utilitários
   */
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  getSyncIntervalOptions() {
    return this.syncConfig.getSyncIntervalOptions();
  }

  getCurlCommands() {
    return this.pullSyncControl.getCurlCommands();
  }

  getStatusIcon(status: boolean | null) {
    if (status === null) return 'help-outline';
    return status ? 'checkmark-circle' : 'close-circle';
  }

  getStatusColor(status: boolean | null) {
    if (status === null) return 'medium';
    return status ? 'success' : 'danger';
  }
}
