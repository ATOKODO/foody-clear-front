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
}
