// 👁️ Intersection Observer Service
// Lazy loading inteligente para performance

import { Injectable, ElementRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface IntersectionEntry {
  element: HTMLElement;
  isIntersecting: boolean;
  intersectionRatio: number;
}

@Injectable({
  providedIn: 'root',
})
export class IntersectionObserverService {
  private observers = new Map<string, IntersectionObserver>();
  private subjects = new Map<string, Subject<IntersectionEntry>>();

  /**
   * Cria um observer para elementos com lazy loading
   */
  createLazyLoadObserver(
    threshold: number = 0.1,
    rootMargin: string = '50px',
  ): Observable<IntersectionEntry> {
    const observerId = `lazy-${threshold}-${rootMargin}`;

    if (!this.subjects.has(observerId)) {
      const subject = new Subject<IntersectionEntry>();
      this.subjects.set(observerId, subject);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            subject.next({
              element: entry.target as HTMLElement,
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
            });
          });
        },
        {
          threshold,
          rootMargin,
        },
      );

      this.observers.set(observerId, observer);
    }

    return this.subjects.get(observerId)!.asObservable();
  }

  /**
   * Observa um elemento específico
   */
  observe(element: HTMLElement, observerId: string): void {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.observe(element);
    }
  }

  /**
   * Para de observar um elemento
   */
  unobserve(element: HTMLElement, observerId: string): void {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.unobserve(element);
    }
  }

  /**
   * Desconecta um observer
   */
  disconnect(observerId: string): void {
    const observer = this.observers.get(observerId);
    const subject = this.subjects.get(observerId);

    if (observer) {
      observer.disconnect();
      this.observers.delete(observerId);
    }

    if (subject) {
      subject.complete();
      this.subjects.delete(observerId);
    }
  }

  /**
   * Limpa todos os observers
   */
  disconnectAll(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.subjects.forEach((subject) => subject.complete());
    this.observers.clear();
    this.subjects.clear();
  }
}
