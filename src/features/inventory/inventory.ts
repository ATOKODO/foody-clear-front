import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InventoryService } from '../../services/inventory-service';
import {
  CreateInventoryDto,
  InventoryProductQtyDto,
  UpdateInventoryDto,
  UpdateInventoryProductsDto,
} from '../../interfaces/inventory.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-inventory',
  imports: [
    JsonPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  baseUrl = '';
  form: FormGroup = new FormGroup({});
  loading = false;

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(
    private fb: FormBuilder,
    private inventorySrv: InventoryService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.inventorySrv.baseUrl;

    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      productIdsStr: this.fb.control<string | null>(null),
      productsJson: this.fb.control<string | null>(null),
      addProductIdsStr: this.fb.control<string | null>(null),
      addProductsJson: this.fb.control<string | null>(null),
      removeProductIdsStr: this.fb.control<string | null>(null),
      removeProductsJson: this.fb.control<string | null>(null),
    });
  }

  onBaseUrlChange() {
    this.inventorySrv.setBaseUrl(this.baseUrl);
  }

  private parseCsvIds(
    csv: string | null | undefined,
    fieldName: string,
  ): number[] | undefined {
    if (!csv || csv.trim() === '') {
      return undefined;
    }

    const tokens = csv
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value !== '');

    if (tokens.length === 0) {
      return undefined;
    }

    const ids = tokens.map((value) => Number(value));
    const hasInvalid = ids.some(
      (id) => Number.isNaN(id) || !Number.isInteger(id) || id < 1,
    );

    if (hasInvalid) {
      throw new Error(`${fieldName} doit contenir des ids entiers > 0 (CSV).`);
    }

    return Array.from(new Set(ids));
  }

  private parseProductsJson(
    rawJson: string | null | undefined,
    fieldName: string,
  ): InventoryProductQtyDto[] | undefined {
    if (!rawJson || rawJson.trim() === '') {
      return undefined;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error(`${fieldName} doit etre un JSON valide.`);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(`${fieldName} doit etre un tableau JSON non vide.`);
    }

    const products = parsed.map((value, index) => {
      if (!value || typeof value !== 'object') {
        throw new Error(`${fieldName}[${index}] doit etre un objet.`);
      }

      const item = value as Record<string, unknown>;
      const productId = Number(item['productId']);
      const qty = Number(item['qty']);

      if (!Number.isInteger(productId) || productId < 1) {
        throw new Error(`${fieldName}[${index}].productId doit etre un entier > 0.`);
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`${fieldName}[${index}].qty doit etre > 0.`);
      }

      return { productId, qty };
    });

    const merged = new Map<number, number>();
    products.forEach((product) => {
      merged.set(product.productId, (merged.get(product.productId) ?? 0) + product.qty);
    });

    return Array.from(merged.entries()).map(([productId, qty]) => ({ productId, qty }));
  }

  private pickCreatePayload(): CreateInventoryDto {
    const value = this.form.getRawValue();
    const name = value.name.trim();

    if (name === '') {
      throw new Error('Pour CREATE, le champ name est requis.');
    }

    const dto: CreateInventoryDto = { name };
    const productIds = this.parseCsvIds(value.productIdsStr, 'productIds');
    const products = this.parseProductsJson(value.productsJson, 'products');

    if (productIds && productIds.length > 0) {
      dto.productIds = productIds;
    }

    if (products && products.length > 0) {
      dto.products = products;
    }

    return dto;
  }

  private pickUpdatePayload(): UpdateInventoryDto {
    const value = this.form.getRawValue();
    const dto: UpdateInventoryDto = {};

    if (value.name && value.name.trim() !== '') {
      dto.name = value.name.trim();
    }

    return dto;
  }

  private pickProductsPayload(
    csv: string | null | undefined,
    productsJson: string | null | undefined,
    operationLabel: string,
  ): UpdateInventoryProductsDto {
    const productIds = this.parseCsvIds(csv, 'productIds');
    const products = this.parseProductsJson(productsJson, 'products');

    if ((!productIds || productIds.length === 0) && (!products || products.length === 0)) {
      throw new Error(`Pour ${operationLabel}, productIds ou products est requis.`);
    }

    return {
      ...(productIds && productIds.length > 0 ? { productIds } : {}),
      ...(products && products.length > 0 ? { products } : {}),
    };
  }

  private setResult(response: unknown) {
    this.lastResponse = response;
    this.lastError = null;
    this.loading = false;
  }

  private setError(error: unknown) {
    this.lastError = error;
    this.loading = false;
  }

  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.inventorySrv.create(dto).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  getAll() {
    this.loading = true;
    this.inventorySrv.findAll().subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour GET /inventory/:id');
      return;
    }

    this.loading = true;
    this.inventorySrv.findOne(id).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  getProducts() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError(
        'Veuillez renseigner un id pour GET /inventory/:id/products',
      );
      return;
    }

    this.loading = true;
    this.inventorySrv.findProducts(id).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour PATCH /inventory/:id');
      return;
    }

    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0) {
      this.setError('Aucun champ a mettre a jour.');
      return;
    }

    this.loading = true;
    this.inventorySrv.update(id, dto).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  addProducts() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError(
        'Veuillez renseigner un id pour PATCH /inventory/:id/products/add',
      );
      return;
    }

    this.loading = true;
    try {
      const dto = this.pickProductsPayload(
        this.form.value.addProductIdsStr,
        this.form.value.addProductsJson,
        'products/add',
      );

      this.inventorySrv.addProducts(id, dto).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  removeProducts() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError(
        'Veuillez renseigner un id pour PATCH /inventory/:id/products/remove',
      );
      return;
    }

    this.loading = true;
    try {
      const dto = this.pickProductsPayload(
        this.form.value.removeProductIdsStr,
        this.form.value.removeProductsJson,
        'products/remove',
      );

      this.inventorySrv.removeProducts(id, dto).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour DELETE /inventory/:id');
      return;
    }

    this.loading = true;
    this.inventorySrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: (error) => this.setError(error),
    });
  }

  fillDemoCreate() {
    this.form.patchValue({
      id: null,
      name: 'Stock principal',
      productIdsStr: '1,2,3',
      productsJson: '[{"productId":1,"qty":2.5},{"productId":3,"qty":1}]',
      addProductIdsStr: '4,5',
      addProductsJson: '[{"productId":7,"qty":3}]',
      removeProductIdsStr: '2',
      removeProductsJson: '[{"productId":5,"qty":1}]',
    });
  }

  clear() {
    this.form.reset({
      id: null,
      name: '',
      productIdsStr: null,
      productsJson: null,
      addProductIdsStr: null,
      addProductsJson: null,
      removeProductIdsStr: null,
      removeProductsJson: null,
    });

    this.lastResponse = null;
    this.lastError = null;
  }
}
