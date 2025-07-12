import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  Renderer2,
  Output,
  EventEmitter
} from '@angular/core';

/**
 * Diretiva para lazy loading avançado de imagens com:
 * - Intersection Observer API
 * - Placeholder e loading states
 * - Retry automático em caso de erro
 * - Preload de imagens próximas
 * - Suporte a WebP com fallback
 */
@Directive({
  selector: '[appLazyLoadImage]'
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input('appLazyLoadImage') imageSrc: string = '';
  @Input() placeholder: string = 'assets/images/pokemon-placeholder.png';
  @Input() errorImage: string = 'assets/images/pokemon-error.png';
  @Input() loadingClass: string = 'lazy-loading';
  @Input() loadedClass: string = 'lazy-loaded';
  @Input() errorClass: string = 'lazy-error';
  @Input() retryAttempts: number = 3;
  @Input() retryDelay: number = 1000; // ms
  @Input() rootMargin: string = '50px'; // Margem para preload
  @Input() threshold: number = 0.1; // 10% visível para trigger

  @Output() imageLoaded = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Error>();
  @Output() imageStartLoading = new EventEmitter<void>();

  private observer: IntersectionObserver | null = null;
  private currentAttempt = 0;
  private isLoading = false;
  private isLoaded = false;
  private retryTimeout: any;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.setupInitialState();
    this.createObserver();
    this.startObserving();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  /**
   * Configura o estado inicial da imagem
   */
  private setupInitialState(): void {
    const img = this.el.nativeElement;
    
    // Definir placeholder inicial
    this.renderer.setAttribute(img, 'src', this.placeholder);
    this.renderer.addClass(img, this.loadingClass);
    
    // Adicionar atributos de acessibilidade
    if (!img.getAttribute('alt')) {
      this.renderer.setAttribute(img, 'alt', 'Loading image...');
    }
    
    // Adicionar loading="lazy" nativo como fallback
    this.renderer.setAttribute(img, 'loading', 'lazy');
  }

  /**
   * Cria o Intersection Observer
   */
  private createObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores sem suporte
      this.loadImage();
      return;
    }

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoaded && !this.isLoading) {
          this.loadImage();
          this.stopObserving();
        }
      });
    }, options);
  }

  /**
   * Inicia a observação do elemento
   */
  private startObserving(): void {
    if (this.observer) {
      this.observer.observe(this.el.nativeElement);
    }
  }

  /**
   * Para a observação do elemento
   */
  private stopObserving(): void {
    if (this.observer) {
      this.observer.unobserve(this.el.nativeElement);
    }
  }

  /**
   * Carrega a imagem com suporte a WebP e retry
   */
  private async loadImage(): Promise<void> {
    if (this.isLoading || this.isLoaded || !this.imageSrc) {
      return;
    }

    this.isLoading = true;
    this.currentAttempt++;
    
    const img = this.el.nativeElement;
    this.renderer.addClass(img, this.loadingClass);
    this.imageStartLoading.emit();

    try {
      // Tentar carregar versão WebP primeiro (se suportado)
      const imageUrl = await this.getOptimalImageUrl(this.imageSrc);
      
      // Precarregar a imagem
      await this.preloadImage(imageUrl);
      
      // Aplicar a imagem carregada
      this.applyLoadedImage(imageUrl);
      
    } catch (error) {
      console.error(`Erro ao carregar imagem (tentativa ${this.currentAttempt}):`, error);
      this.handleImageError(error as Error);
    }
  }

  /**
   * Obtém a URL otimizada da imagem (WebP se suportado)
   */
  private async getOptimalImageUrl(originalUrl: string): Promise<string> {
    // Verificar se o navegador suporta WebP
    if (await this.supportsWebP()) {
      // Tentar converter URL para WebP (se aplicável)
      const webpUrl = this.convertToWebP(originalUrl);
      if (webpUrl !== originalUrl) {
        try {
          await this.preloadImage(webpUrl);
          return webpUrl;
        } catch {
          // Fallback para URL original se WebP falhar
        }
      }
    }
    
    return originalUrl;
  }

  /**
   * Verifica se o navegador suporta WebP
   */
  private supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Converte URL para WebP (para APIs que suportam)
   */
  private convertToWebP(url: string): string {
    // Para PokéAPI, não há suporte direto a WebP
    // Para outras APIs, implementar lógica específica
    return url;
  }

  /**
   * Precarrega uma imagem
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      
      // Timeout para evitar travamento
      setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, 10000);
      
      img.src = url;
    });
  }

  /**
   * Aplica a imagem carregada ao elemento
   */
  private applyLoadedImage(url: string): void {
    const img = this.el.nativeElement;
    
    // Remover classes de loading
    this.renderer.removeClass(img, this.loadingClass);
    this.renderer.removeClass(img, this.errorClass);
    
    // Aplicar imagem e classe de sucesso
    this.renderer.setAttribute(img, 'src', url);
    this.renderer.addClass(img, this.loadedClass);
    
    // Atualizar alt text
    if (img.getAttribute('alt') === 'Loading image...') {
      this.renderer.setAttribute(img, 'alt', 'Loaded image');
    }
    
    this.isLoading = false;
    this.isLoaded = true;
    this.imageLoaded.emit();
    
    console.log(`✅ Lazy image loaded: ${url}`);
  }

  /**
   * Trata erros de carregamento com retry
   */
  private handleImageError(error: Error): void {
    this.isLoading = false;
    
    if (this.currentAttempt < this.retryAttempts) {
      // Retry com delay exponencial
      const delay = this.retryDelay * Math.pow(2, this.currentAttempt - 1);
      console.log(`🔄 Retrying image load in ${delay}ms (attempt ${this.currentAttempt + 1}/${this.retryAttempts})`);
      
      this.retryTimeout = setTimeout(() => {
        this.loadImage();
      }, delay);
    } else {
      // Todas as tentativas falharam, usar imagem de erro
      this.applyErrorImage();
      this.imageError.emit(error);
    }
  }

  /**
   * Aplica imagem de erro
   */
  private applyErrorImage(): void {
    const img = this.el.nativeElement;
    
    this.renderer.removeClass(img, this.loadingClass);
    this.renderer.addClass(img, this.errorClass);
    this.renderer.setAttribute(img, 'src', this.errorImage);
    this.renderer.setAttribute(img, 'alt', 'Failed to load image');
    
    console.error(`❌ Failed to load image after ${this.retryAttempts} attempts`);
  }

  /**
   * Limpeza de recursos
   */
  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Força o carregamento da imagem (método público)
   */
  public forceLoad(): void {
    if (!this.isLoaded) {
      this.stopObserving();
      this.loadImage();
    }
  }

  /**
   * Redefine a imagem (método público)
   */
  public reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.currentAttempt = 0;
    this.cleanup();
    this.setupInitialState();
    this.createObserver();
    this.startObserving();
  }
}
