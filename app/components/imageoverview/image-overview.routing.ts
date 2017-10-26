import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ImageOverviewComponent} from './image-overview.component';

const routes: Routes = [
    {
        path: 'images',
        component: ImageOverviewComponent
    }
];

export const imagesRouting: ModuleWithProviders = RouterModule.forChild(routes);