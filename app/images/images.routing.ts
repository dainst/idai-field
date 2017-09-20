import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ImagesComponent} from './images.component';
import {ImageGridComponent} from './image-grid.component';
import {ImageViewComponent} from './image-view.component';
import {ImagesCanDeactivateGuard} from './images-can-deactivate-guard';

const routes: Routes = [
    {
        path: 'images',
        component: ImagesComponent,
        children: [
            {
                path: '',
                component: ImageGridComponent,
                canDeactivate: [ImagesCanDeactivateGuard]
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