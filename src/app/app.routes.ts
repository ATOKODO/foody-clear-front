import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { Product } from '../features/product/product';
import { Category } from '../features/category/category';
import { Tag } from '../features/tag/tag';
import { GenericProduct } from '../features/generic-product/generic-product';
import { NutritionValues } from '../features/nutrition-value/nutrition-value';
import { Inventory } from '../features/inventory/inventory';
import { CycleFeature } from '../features/cycle/cycle.feature';
import { InputDayFeature } from '../features/input-day/input-day.feature';
import { Calendar } from '../components/calendar/calendar';
import { DaySetFeature } from '../features/day-set/day-set.feature';
import { SlotFeature } from '../features/slot/slot.feature';
import { PlanningFeature } from '../features/planning/planning.feature';
import { StatisticFeature } from '../features/statistic/statistic.feature';
import { TemplateFeature } from '../features/template/template.feature';

export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'home'},
    {path: 'home', component: Home, title: 'Accueil'},
    {path: 'product', component: Product, title: 'Catalogue'},
    {path: 'category', component: Category, title: 'Categories'},
    {path: 'generic-product', component: GenericProduct, title: 'Produits generiques'},
    {path: 'tag', component: Tag, title: 'Tags'},
    {path: 'nutrition-value', component: NutritionValues, title: 'Valeurs nutritionnelles'},
    {path: 'inventory', component: Inventory, title: 'Inventaires'},
    {path: 'cycle', component: CycleFeature, title: 'Cycles'},
    {path: 'input-day', component: InputDayFeature, title: 'Saisie du jour'},
    {path: 'day-set', component: DaySetFeature, title: 'Jours types'},
    {path: 'slot', component: SlotFeature, title: 'Plages horaires'},
    {path: 'template', component: TemplateFeature, title: 'Modeles'},
    {path: 'calendar', component: Calendar, title: 'Calendrier'},
    {path: 'planning', component: PlanningFeature, title: 'Assignations'},
    {path: 'statistic', component: StatisticFeature, title: 'Statistiques'},
];
