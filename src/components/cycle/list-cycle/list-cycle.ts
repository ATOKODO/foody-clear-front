import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface CycleItem {
  id: string;
  startDate: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  selected?: boolean;
}

@Component({
  selector: 'app-list-cycle',
  imports: [CommonModule],
  templateUrl: './list-cycle.html',
  styleUrl: './list-cycle.scss',
})
export class ListCycle {
  readonly cycles: CycleItem[] = [
    {
      id: '1',
      startDate: '01/01/2024',
      name: 'Prise de masse',
      protein: 50,
      carbs: 120,
      fat: 30,
      selected: true,
    },
    {
      id: '2',
      startDate: '01/01/2024',
      name: 'Seche',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '3',
      startDate: '01/01/2024',
      name: 'Maintien',
      protein: 50,
      carbs: 150,
      fat: 30,
    },
  ];

  onEdit(cycle: CycleItem): void {
    console.log('Edit cycle:', cycle);
  }

  onDelete(cycle: CycleItem): void {
    console.log('Delete cycle:', cycle);
  }

  onAddCycle(): void {
    console.log('Add cycle');
  }
}
