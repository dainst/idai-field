import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ImageViewComponent} from './image-view.component';

const routes: Routes = [
    {
        path: 'images/:id/:menu',
        component: ImageViewComponent
    },
    {
        path: 'images/:id/:menu/:tab',
        component: ImageViewComponent
    }
];

export const imageViewRouting: ModuleWithProviders = RouterModule.forChild(routes);