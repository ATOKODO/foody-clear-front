import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CycleFormValue,
  CycleFormMode,
  FormCycle,
} from '../../components/cycle/form-cycle/form-cycle';
import {
  CycleListItem,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import { CycleService } from '../../services/cycle-service';
import { CreateCycleDto, Cycle } from '../../interfaces/cycle.interface';

@Component({
  selector: 'app-cycle',
  imports: [CommonModule, FormsModule, ListCycle, FormCycle],
  templateUrl: './cycle.feature.html',
  styleUrl: './cycle.feature.scss',
})
export class CycleFeature implements OnInit {
  baseUrl = '';
  loading = false;
  saving = false;

  cycles: Cycle[] = [];
  selectedCycleId: number | null = null;

  formVisible = false;
  formMode: CycleFormMode = 'add';
  editingCycleId: number | null = null;

  formInitialValue: Partial<CycleFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(private cycleSrv: CycleService) {}

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.loadCycles();
  }

  onBaseUrlChange() {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.loadCycles();
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) => ({
      id: cycle.id,
      title: cycle.title,
      color: cycle.color,
      proteins: cycle.proteins,
      carbs: cycle.carbs,
      lipids: cycle.lipids,
      durationCount: cycle.durationCount,
      durationType: cycle.durationType,
    }));
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.formVisible = true;
  }

  onEditRequested(item: CycleListItem): void {
    const cycle = this.cycles.find((value) => value.id === item.id);
    if (!cycle) {
      return;
    }

    this.formMode = 'edit';
    this.editingCycleId = cycle.id;
    this.selectedCycleId = cycle.id;
    this.formInitialValue = {
      titre: cycle.title,
      couleur: cycle.color,
      proteines: cycle.proteins,
      glucides: cycle.carbs,
      lipides: cycle.lipids,
      nombre: cycle.durationCount,
      typeDuree: cycle.durationType,
    };
    this.formVisible = true;
  }

  onDeleteRequested(item: CycleListItem): void {
    this.saving = true;
    this.cycleSrv.remove(item.id).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: item.id };
        this.lastError = null;
        this.saving = false;

        if (this.editingCycleId === item.id) {
          this.onCancelForm();
        }

        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: CycleFormMode; value: CycleFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingCycleId !== null) {
      this.cycleSrv.update(this.editingCycleId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.formVisible = false;
          this.loadCycles();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.cycleSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
  }

  private loadCycles(): void {
    this.loading = true;
    this.cycleSrv.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.selectedCycleId !== null &&
          !this.cycles.some((cycle) => cycle.id === this.selectedCycleId)
        ) {
          this.selectedCycleId = null;
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private toCreateDto(value: CycleFormValue): CreateCycleDto {
    return {
      title: value.titre,
      color: value.couleur,
      proteins: value.proteines,
      carbs: value.glucides,
      lipids: value.lipides,
      durationCount: value.nombre,
      durationType: value.typeDuree,
    };
  }
}
