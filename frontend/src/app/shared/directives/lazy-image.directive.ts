import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { ImageOptimizationService } from '../../services/image-optimization.service';
import { Subscription } from 'rxjs';

/**
 * Diretiva para carregar imagens de forma otimizada e com lazy loading
 * Uso: <img [lazyImage]="imageUrl" [size]="'medium'" [pokemonId]="25" alt="Pokemon">
 */
@Directive({
  selector: '[lazyImage]'
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() lazyImage: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() pokemonId: number = 0;

  private observer: IntersectionObserver | null = null;
  private subscription: Subscription | null = null;
  private hasLoaded: boolean = false;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
    private imageService: ImageOptimizationService
  ) {}

  ngOnInit(): void {
    this.setupLazyLoading();
  }

  ngOnDestroy(): void {
    // Limpa recursos
    this.observer?.disconnect();
    this.subscription?.unsubscribe();
  }

  /**
   * Configura lazy loading usando Intersection Observer
   */
  private setupLazyLoading(): void {
    // Cria um placeholder baseado no ID do Pokémon
    const placeholder = this.imageService.createPlaceholder(this.pokemonId);
    this.renderer.setAttribute(this.el.nativeElement, 'src', placeholder);

    // Adiciona classes e animações
    this.renderer.addClass(this.el.nativeElement, 'lazy-image');
    this.renderer.addClass(this.el.nativeElement, 'loading');

    // Adiciona indicador de carregamento
    this.addLoadingIndicator();

    // Configura Intersection Observer para carregar apenas quando visível
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasLoaded) {
          this.loadImage();
          // Desconecta observer após carregamento
          this.observer?.disconnect();
        }
      });
    }, {
      rootMargin: '100px', // Pré-carrega quando está a 100px da viewport
      threshold: 0.01
    });

    this.observer.observe(this.el.nativeElement);
  }

  /**
   * Adiciona spinner de carregamento
   */
  private addLoadingIndicator(): void {
    // Cria um wrapper para a imagem
    const wrapper = this.renderer.createElement('div');
    this.renderer.addClass(wrapper, 'lazy-image-wrapper');

    // Clona o elemento para preservar os atributos
    const parent = this.el.nativeElement.parentNode;
    this.renderer.insertBefore(parent, wrapper, this.el.nativeElement);
    this.renderer.appendChild(wrapper, this.el.nativeElement);

    // Adiciona spinner
    const spinner = this.renderer.createElement('div');
    this.renderer.addClass(spinner, 'lazy-image-spinner');
    this.renderer.appendChild(wrapper, spinner);

    // Estiliza o wrapper para posicionar o spinner
    this.renderer.setStyle(wrapper, 'position', 'relative');
    this.renderer.setStyle(wrapper, 'display', 'inline-block');

    // Cria elemento spinner que parece uma pokébola
    const spinnerHtml = `
      <div class="pokeball-spinner">
        <div class="pokeball-upper"></div>
        <div class="pokeball-middle"></div>
        <div class="pokeball-lower"></div>
        <div class="pokeball-button"></div>
      </div>
    `;
    spinner.innerHTML = spinnerHtml;
  }

  /**
   * Carrega a imagem otimizada quando o elemento se torna visível
   */
  private loadImage(): void {
    // Marca como carregado para prevenir carregamentos duplicados
    this.hasLoaded = true;

    // Carrega a imagem otimizada
    this.subscription = this.imageService
      .getOptimizedImage(this.lazyImage, this.size)
      .subscribe({
        next: (optimizedUrl) => {
          // Adiciona evento para remover classes de loading quando a imagem carrega
          const loadHandler = () => {
            this.renderer.removeClass(this.el.nativeElement, 'loading');
            this.renderer.addClass(this.el.nativeElement, 'loaded');

            // Remove spinner
            const wrapper = this.el.nativeElement.parentElement;
            if (wrapper && wrapper.classList.contains('lazy-image-wrapper')) {
              const spinner = wrapper.querySelector('.lazy-image-spinner');
              if (spinner) {
                this.renderer.removeChild(wrapper, spinner);
              }
            }

            // Remove o listener após uso
            this.el.nativeElement.removeEventListener('load', loadHandler);
          };

          this.el.nativeElement.addEventListener('load', loadHandler);

          // Define a URL otimizada
          this.renderer.setAttribute(this.el.nativeElement, 'src', optimizedUrl);

          // Opcional: adicionar srcset para diferentes resoluções
          if (this.size === 'medium' || this.size === 'large') {
            // Em produção, gerar URLs para diferentes tamanhos
            // this.renderer.setAttribute(this.el.nativeElement, 'srcset', srcSetValue);
          }
        },
        error: (err) => {
          console.error('Error loading optimized image:', err);
          // Fallback para URL original em caso de erro
          this.renderer.setAttribute(this.el.nativeElement, 'src', this.lazyImage);
          this.renderer.removeClass(this.el.nativeElement, 'loading');
        }
      });
  }
}
