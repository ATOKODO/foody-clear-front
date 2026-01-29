import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
}
