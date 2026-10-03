import { Routes } from '@angular/router';
















export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'home'},
    {path: 'home', loadComponent: () => import('../features/home/home').then(m => m.Home), title: 'Home'},
    {path: 'product', loadComponent: () => import('../features/product/product').then(m => m.Product), title: 'Catalogue'},
    {path: 'category', loadComponent: () => import('../features/category/category').then(m => m.Category), title: 'Categories'},
    {path: 'generic-product', loadComponent: () => import('../features/generic-product/generic-product').then(m => m.GenericProduct), title: 'Generic products'},
    {path: 'tag', loadComponent: () => import('../features/tag/tag').then(m => m.Tag), title: 'Tags'},
    {path: 'inventory', loadComponent: () => import('../features/inventory/inventory').then(m => m.Inventory), title: 'Inventories'},
    {path: 'shopping-list', loadComponent: () => import('../features/shopping-list/shopping-list').then(m => m.ShoppingList), title: 'Shopping lists'},
    {path: 'meal-prep', loadComponent: () => import('../features/meal-prep/meal-prep.feature').then(m => m.MealPrepFeature), title: 'Meal prep'},
    {path: 'cycle', loadComponent: () => import('../features/cycle/cycle.feature').then(m => m.CycleFeature), title: 'Cycles'},
    {path: 'input-day', loadComponent: () => import('../features/input-day/input-day.feature').then(m => m.InputDayFeature), title: 'Day input'},
    {path: 'day-set', loadComponent: () => import('../features/day-set/day-set.feature').then(m => m.DaySetFeature), title: 'Day sets'},
    {path: 'slot', loadComponent: () => import('../features/slot/slot.feature').then(m => m.SlotFeature), title: 'Time slots'},
    {path: 'template', loadComponent: () => import('../features/template/template.feature').then(m => m.TemplateFeature), title: 'Templates'},
    {path: 'calendar', loadComponent: () => import('../components/calendar/calendar').then(m => m.Calendar), title: 'Calendar'},
    {path: 'planning', loadComponent: () => import('../features/planning/planning.feature').then(m => m.PlanningFeature), title: 'Assignments'},
    {path: 'statistic', loadComponent: () => import('../features/statistic/statistic.feature').then(m => m.StatisticFeature), title: 'Statistics'},
];
