import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ResourceOverviewComponent} from './resource-overview.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {DocumentEditNavigationComponent} from '../document-edit-navigation.component';
import {CanDeactivateDocumentEditWrapperGuard}  from '../can-deactivate-document-edit-wrapper-guard';

const routes: Routes = [
    {
        path: 'resources',
        component: ResourceOverviewComponent,
        children: [
            {
                path: '',
                component: MapWrapperComponent
            },
            {
                path: 'editGeometry/:id/:editMode',
                component: MapWrapperComponent
            },
            {
                path: 'new', // ;type=typename
                component: DocumentEditNavigationComponent,
                canDeactivate: [CanDeactivateDocumentEditWrapperGuard]
            },
            {
                path: ':id/edit',
                component: DocumentEditNavigationComponent,
                canDeactivate: [CanDeactivateDocumentEditWrapperGuard]
            }
        ]
    }
];

export const resourceOverviewRouting: ModuleWithProviders = RouterModule.forChild(routes);