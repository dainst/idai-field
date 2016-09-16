import { ModuleWithProviders }   from '@angular/core';
import {Routes,RouterModule} from '@angular/router';
import {MapComponent} from './map.component';
import {OverviewComponent} from './overview.component';
import {DocumentViewComponent} from './document-view.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';


const overviewRoutes: Routes = [
    {
        path: 'resources',
        component: OverviewComponent,
        children: [
            {
                path: '',
                component: MapComponent
            },
            {
                path: 'map',
                component: MapComponent
            },
            {
                path: ':id',
                component: DocumentViewComponent
            },
            {
                path: ':id/edit',
                component: DocumentEditWrapperComponent
            }
        ]
    }
];

export const overviewRouting: ModuleWithProviders = RouterModule.forChild(overviewRoutes);