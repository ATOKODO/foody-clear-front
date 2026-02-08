import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { Product } from '../features/product/product';
import { Category } from '../features/category/category';
import { Tag } from '../features/tag/tag';
import { GenericProduct } from '../features/generic-product/generic-product';
import { NutritionValues } from '../features/nutrition-value/nutrition-value';
import { Inventory } from '../features/inventory/inventory';
import { CycleFeature } from '../features/cycle/cycle.feature';
import { Calendar } from '../components/calendar/calendar';

export const routes: Routes = [
    {path: 'home', component: Home},
    {path: 'product', component: Product},
    {path: 'category', component: Category},
    {path: 'generic-product', component: GenericProduct},
    {path: 'tag', component: Tag},
    {path: 'nutrition-value', component: NutritionValues},
    {path: 'inventory', component: Inventory},
    {path: 'cycle', component: CycleFeature},
    {path: 'calendar', component: Calendar},
];
