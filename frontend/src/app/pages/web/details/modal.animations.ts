import { trigger, state, style, transition, animate, keyframes, stagger, query } from '@angular/animations';

export const modalAnimations = [
  trigger('modalEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.8)' }),
      animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
        style({ opacity: 1, transform: 'scale(1)' })
      )
    ]),
    transition(':leave', [
      animate('200ms ease-in',
        style({ opacity: 0, transform: 'scale(0.8)' })
      )
    ])
  ]),

  trigger('fadeInStagger', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(100, [
          animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateY(0)' })
          )
        ])
      ], { optional: true })
    ])
  ]),

  trigger('tabSlide', [
    // Estados finais para todas as abas (garantir que todas terminem no mesmo estado)
    state('overview', style({
      opacity: 1,
      transform: 'translateX(0)',
      position: 'relative',
      zIndex: 1
    })),
    state('combat', style({
      opacity: 1,
      transform: 'translateX(0)',
      position: 'relative',
      zIndex: 1
    })),
    state('evolution', style({
      opacity: 1,
      transform: 'translateX(0)',
      position: 'relative',
      zIndex: 1
    })),
    state('curiosities', style({
      opacity: 1,
      transform: 'translateX(0)',
      position: 'relative',
      zIndex: 1
    })),

    // Transições específicas Overview ↔ Combat (SEM ANIMAÇÃO para evitar vazamento)
    transition('overview => combat', [
      style({
        opacity: 1,
        transform: 'translateX(0)',
        position: 'relative',
        zIndex: 1
      })
    ]),

    transition('combat => overview', [
      style({
        opacity: 1,
        transform: 'translateX(0)',
        position: 'relative',
        zIndex: 1
      })
    ]),

    // Transições entre Evolution e Curiosities (fade rápido)
    transition('evolution => curiosities', [
      style({ opacity: 0 }),
      animate('100ms ease-out', style({ opacity: 1 }))
    ]),

    transition('curiosities => evolution', [
      style({ opacity: 0 }),
      animate('100ms ease-out', style({ opacity: 1 }))
    ]),

    // Transições para outras combinações (fade simples e rápido)
    transition('* => *', [
      style({ opacity: 0 }),
      animate('100ms ease-out', style({ opacity: 1 }))
    ])
  ]),

  trigger('statBarFill', [
    transition(':enter', [
      style({ width: '0%' }),
      animate('800ms 200ms ease-out',
        style({ width: '{{ percentage }}%' })
      )
    ], { params: { percentage: 0 } })
  ]),

  trigger('headerPulse', [
    state('idle', style({ transform: 'scale(1)' })),
    state('pulse', style({ transform: 'scale(1.05)' })),
    transition('idle <=> pulse', animate('200ms ease-in-out'))
  ]),

  trigger('fadeInOut', [
    state('visible', style({ opacity: 1 })),
    state('hidden', style({ opacity: 0 })),
    transition('visible <=> hidden', animate('300ms ease-in-out'))
  ])
];
