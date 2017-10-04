import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ImagesComponent} from './images.component';
import {ImageOverviewComponent} from './image-overview.component';

const routes: Routes = [
    {
        path: 'images',
        component: ImagesComponent,
        children: [
            {
                path: '',
                component: ImageOverviewComponent
            }
        ]
    }
];

export const imagesRouting: ModuleWithProviders = RouterModule.forChild(routes);