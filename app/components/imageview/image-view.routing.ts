import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ImageViewComponent} from './image-view.component';

const routes: Routes = [
    {
        path: 'images/:id/show',
        component: ImageViewComponent
    },
    {
        path: 'images/:id/show/:tab',
        component: ImageViewComponent
    }
];

export const imageViewRouting: ModuleWithProviders = RouterModule.forChild(routes);