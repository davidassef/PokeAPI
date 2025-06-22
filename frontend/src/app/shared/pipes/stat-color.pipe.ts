import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statColor'
})
export class StatColorPipe implements PipeTransform {
  transform(statValue: number): string {
    if (statValue >= 150) return '#2ecc71'; // Excellent - Green
    if (statValue >= 120) return '#3498db'; // Very Good - Blue
    if (statValue >= 90) return '#f39c12';  // Good - Orange
    if (statValue >= 60) return '#e67e22';  // Average - Dark Orange
    if (statValue >= 30) return '#e74c3c';  // Poor - Red
    return '#95a5a6'; // Very Poor - Gray
  }
}
