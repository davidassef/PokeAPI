import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyImageDirective } from './lazy-image.directive';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

@NgModule({
  declarations: [
    LazyImageDirective,
    LazyLoadImageDirective
  ],
  imports: [CommonModule],
  exports: [
    LazyImageDirective,
    LazyLoadImageDirective
  ]
})
export class SharedDirectivesModule { }
