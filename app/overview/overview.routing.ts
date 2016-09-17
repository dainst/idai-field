import { ModuleWithProviders }   from '@angular/core';
import {Routes,RouterModule} from '@angular/router';
import {OverviewComponent} from './overview.component';
import {DocumentViewWrapperComponent} from './document-view-wrapper.component';
import {OverviewHomeComponent} from './overview-home.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';


const overviewRoutes: Routes = [
    {
        path: 'resources',
        component: OverviewComponent,
        children: [
            {
                path: '',
                component: OverviewHomeComponent
            },
            {
                path: ':id',
                component: DocumentViewWrapperComponent
            },
            {
                path: ':id/edit',
                component: DocumentEditWrapperComponent
            }
        ]
    }
];

export const overviewRouting: ModuleWithProviders = RouterModule.forChild(overviewRoutes);