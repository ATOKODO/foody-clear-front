import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { Product } from '../features/product/product';

export const routes: Routes = [
    {path: 'home', component: Home},
    {path: 'product', component: Product},
];
