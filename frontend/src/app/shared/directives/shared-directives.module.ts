import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyImageDirective } from './lazy-image.directive';

@NgModule({
  declarations: [LazyImageDirective],
  imports: [CommonModule],
  exports: [LazyImageDirective]
})
export class SharedDirectivesModule { }
