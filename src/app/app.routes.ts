import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { Product } from '../features/product/product';
import { Category } from '../features/category/category';

export const routes: Routes = [
    {path: 'home', component: Home},
    {path: 'product', component: Product},
    {path: 'category', component: Category},
];
