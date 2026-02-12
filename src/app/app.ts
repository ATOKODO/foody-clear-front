import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'foody-clear-front';

    private router = inject(Router);

  goToProduct() {
    this.router.navigate(['/product']);
  }

  goToCategory() {
    this.router.navigate(['/category']);
  }

  goToTag() {
    this.router.navigate(['/tag']);
  }

  goToGenericProduct() {
    this.router.navigate(['/generic-product']);
  }

  goToNutritionValue() {
    this.router.navigate(['/nutrition-value']);
  }

  goToInventory() {
    this.router.navigate(['/inventory']);
  }

  goToInputDay() {
    this.router.navigate(['/input-day']);
  }

  goToCycle() {
    this.router.navigate(['/cycle']);
  }

  goToDaySet() {
    this.router.navigate(['/day-set']);
  }

  goToSlot() {
    this.router.navigate(['/slot']);
  }

  goToCalendar() {
    this.router.navigate(['/calendar']);
  }

  goToPlanning() {
    this.router.navigate(['/planning']);
  }
}
