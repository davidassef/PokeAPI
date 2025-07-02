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
    transition('* => *', [
      style({ transform: 'translateX(10px)', opacity: 0 }),
      animate('250ms ease-out',
        style({ transform: 'translateX(0)', opacity: 1 })
      )
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
  ])
];
