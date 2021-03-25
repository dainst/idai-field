import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ImageOverviewComponent} from './image-overview.component';

const routes: Routes = [
    {
        path: 'images',
        component: ImageOverviewComponent
    },
    {
        path: 'images/conflicts/:id',
        component: ImageOverviewComponent
    }
];

export const imagesRouting: ModuleWithProviders<any /* TODO review any; since angular 10.2.3*/> = RouterModule.forChild(routes);
