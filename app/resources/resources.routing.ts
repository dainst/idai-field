import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {DocumentEditNavigationComponent} from './document-edit-navigation.component';
import {DocumentEditCanDeactivateGuard}  from './document-edit-can-deactivate-guard';

const routes: Routes = [
    {
        path: 'resources',
        component: ResourcesComponent,
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
                canDeactivate: [DocumentEditCanDeactivateGuard]
            },
            {
                path: ':id/edit',
                component: DocumentEditNavigationComponent,
                canDeactivate: [DocumentEditCanDeactivateGuard]
            }
        ]
    }
];

export const resourcesRouting: ModuleWithProviders = RouterModule.forChild(routes);