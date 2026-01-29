import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { Product } from '../features/product/product';
import { Category } from '../features/category/category';
import { Tag } from '../features/tag/tag';
import { GenericProduct } from '../features/generic-product/generic-product';

export const routes: Routes = [
    {path: 'home', component: Home},
    {path: 'product', component: Product},
    {path: 'category', component: Category},
    {path: 'generic-product', component: GenericProduct},
    {path: 'tag', component: Tag},
];
