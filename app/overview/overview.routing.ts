import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {OverviewComponent} from './overview.component';
import {DocumentViewWrapperComponent} from './document-view-wrapper.component';
import {MapWrapperComponent} from '../map/map-wrapper.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {CanDeactivateGuard}    from './can-deactivate-guard';

const overviewRoutes: Routes = [
    {
        path: 'resources',
        component: OverviewComponent,
        children: [
            {
                path: '',
                component: MapWrapperComponent
            },
            {
                path: ':id',
                component: DocumentViewWrapperComponent
            },
            {
                path: ':id/edit',
                component: DocumentEditWrapperComponent,
                canDeactivate: [CanDeactivateGuard]
            }
        ]
    }
];

export const overviewRouting: ModuleWithProviders = RouterModule.forChild(overviewRoutes);