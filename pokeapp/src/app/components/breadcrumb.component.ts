// 🧭 Breadcrumb Component
// Navegação contextual e hierárquica

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
  isActive?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  imports: [CommonModule, IonicModule, TranslatePipe],
  standalone: true,
})
export class BreadcrumbComponent implements OnInit {
  @Input() items: BreadcrumbItem[] = [];
  @Input() showIcons = true;
  @Input() showHome = true;
  @Input() separator = 'chevron-forward';

  homeItem: BreadcrumbItem = {
    label: 'nav.home',
    route: '/tabs/tab1',
    icon: 'home',
  };

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.showHome && this.items.length > 0) {
      // Adiciona item home no início se não existir
      const hasHome = this.items.some(item => item.route === '/tabs/tab1');
      if (!hasHome) {
        this.items.unshift(this.homeItem);
      }
    }

    // Marca o último item como ativo
    if (this.items.length > 0) {
      this.items[this.items.length - 1].isActive = true;
    }
  }

  onItemClick(item: BreadcrumbItem, event: Event) {
    if (item.disabled || item.isActive) {
      event.preventDefault();
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onKeyDown(item: BreadcrumbItem, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onItemClick(item, event);
    }
  }
}
