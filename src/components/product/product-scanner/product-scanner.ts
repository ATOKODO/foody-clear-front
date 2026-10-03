import { TranslatePipe } from '../../../app/i18n/translate-pipe';
import { Language } from '../../../app/i18n/language';
import { FOOD_FACTS_ALLERGEN_LABELS } from '../../../services/open-food-facts.mapper';
import { Component, DestroyRef, ElementRef, OnChanges, OnDestroy, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { BarcodeScannerService } from '../../../services/barcode-scanner-service';
import { FoodFactsProduct, OpenFoodFactsService, isProductBarcode } from '../../../services/open-food-facts-service';

@Component({
  selector: 'app-product-scanner',
  imports: [TranslatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  providers: [BarcodeScannerService],
  templateUrl: './product-scanner.html',
  styleUrl: './product-scanner.scss',
  host: { '(document:visibilitychange)': 'onVisibilityChange()' },
})
export class ProductScanner implements OnChanges, OnDestroy {
  readonly language = inject(Language);
  private readonly allergenKeys = new Map(
    Object.entries(FOOD_FACTS_ALLERGEN_LABELS).map(([key, label]) => [label, `allergen.${key}`]),
  );
  private readonly camera = inject(BarcodeScannerService);
  private readonly foodFacts = inject(OpenFoodFactsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private request: Subscription | null = null;
  private cameraAttempt = 0;

  readonly active = input(true);
  readonly disabled = input(false);
  readonly selected = output<FoodFactsProduct>();
  readonly barcode = signal('');
  readonly scanning = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cameraError = signal<string | null>(null);
  readonly product = signal<FoodFactsProduct | null>(null);
  readonly nutritionLabels: Record<string, string> = {
    ENERGY_KCAL: 'Énergie (kcal)', ENERGY_KJ: 'Énergie (kJ)', FAT: 'Matières grasses',
    SATURATED_FAT: 'Acides gras saturés', CARBOHYDRATE: 'Glucides', SUGARS: 'Sucres',
    PROTEIN: 'Protéines', FIBER: 'Fibres', SALT: 'Sel',
  };

  ngOnChanges(): void {
    if (!this.active() || this.disabled()) this.stopCamera();
  }

  formatAllergens(allergens: readonly string[]): string {
    return allergens.map((allergen) => {
      const key = this.allergenKeys.get(allergen);
      return key ? this.language.translate(key) : allergen;
    }).join(', ');
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onVisibilityChange(): void {
    if (document.hidden) this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (this.disabled() || !this.active() || this.scanning()) return;
    const video = this.video()?.nativeElement;
    if (!video) return;
    this.cameraError.set(null);
    this.scanning.set(true);
    const attempt = ++this.cameraAttempt;
    try {
      await this.camera.start(video, (barcode) => {
        this.scanning.set(false);
        this.barcode.set(barcode);
        this.lookup();
      });
    } catch (error) {
      if (attempt !== this.cameraAttempt) return;
      this.scanning.set(false);
      const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
      this.cameraError.set(name === 'NotAllowedError'
        ? 'Accès à la caméra refusé. Autorisez la caméra dans votre navigateur ou saisissez le code-barres.'
        : name === 'NotFoundError' || name === 'NotReadableError'
          ? 'Caméra indisponible. Fermez les autres applications qui l’utilisent ou saisissez le code-barres.'
          : error instanceof Error ? error.message : 'Impossible de démarrer la caméra.');
    }
  }

  stopCamera(): void {
    this.cameraAttempt += 1;
    this.camera.stop();
    this.scanning.set(false);
  }

  onBarcodeChange(value: string): void {
    this.request?.unsubscribe();
    this.loading.set(false);
    this.barcode.set(value);
    this.product.set(null);
    this.error.set(null);
  }

  lookup(): void {
    if (this.disabled()) return;
    const barcode = this.barcode().trim();
    this.stopCamera();
    this.request?.unsubscribe();
    this.product.set(null);
    this.error.set(null);
    this.loading.set(false);
    if (!isProductBarcode(barcode)) {
      this.error.set('Saisissez un code-barres de 8, 12, 13 ou 14 chiffres.');
      return;
    }
    this.barcode.set(barcode);
    this.loading.set(true);
    this.request = this.foodFacts.lookup(barcode).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        this.error.set(status === 404 ? 'Produit introuvable dans Open Food Facts. Vous pouvez le renseigner dans le formulaire.'
          : status === 429 ? 'Trop de recherches. Réessayez dans une minute.'
            : status === 504 ? 'La recherche a pris trop de temps. Réessayez.'
              : 'La recherche est indisponible. Vérifiez votre connexion et réessayez.');
      },
    });
  }

  useProduct(): void {
    const product = this.product();
    if (product && !this.disabled()) this.selected.emit(product);
  }
}
