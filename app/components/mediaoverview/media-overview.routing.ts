import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MediaOverviewComponent} from './media-overview.component';

const routes: Routes = [
    {
        path: 'media',
        component: MediaOverviewComponent
    }
];

export const mediaRouting: ModuleWithProviders = RouterModule.forChild(routes);