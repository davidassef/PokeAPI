import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ErrorHandlerService, ErrorInfo } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-error-notification',
  templateUrl: './error-notification.component.html',
  styleUrls: ['./error-notification.component.scss']
})
export class ErrorNotificationComponent implements OnInit, OnDestroy {
  errors: ErrorInfo[] = [];
  private subscription?: Subscription;

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    this.subscription = this.errorHandler.errors$.subscribe((errors: ErrorInfo[]) => {
      this.errors = errors;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Dismisses uma notificação específica
   */
  dismissError(errorId: string) {
    this.errorHandler.dismissError(errorId);
  }

  /**
   * Obtém a cor do ícone baseado no tipo
   */
  getIconColor(type: string): string {
    switch (type) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'medium';
    }
  }

  /**
   * Obtém o ícone baseado no tipo
   */
  getIcon(type: string): string {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert';
    }
  }
}
