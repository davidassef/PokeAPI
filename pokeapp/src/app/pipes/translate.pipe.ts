import { Pipe, PipeTransform } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private localizationService: LocalizationService) {}

  transform(key: string): string {
    return this.localizationService.translate(key);
  }
}
