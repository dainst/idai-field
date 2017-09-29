import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ImagesComponent} from './images.component';
import {ImageOverviewComponent} from './image-overview.component';
import {ImageViewComponent} from './image-view.component';

const routes: Routes = [
    {
        path: 'images',
        component: ImagesComponent,
        children: [
            {
                path: '',
                component: ImageOverviewComponent
            },
            {
                path: ':id/show',
                component: ImageViewComponent
            },
            {
                path: ':id/show/:tab',
                component: ImageViewComponent
            }
        ]
    }
];

export const imagesRouting: ModuleWithProviders = RouterModule.forChild(routes);