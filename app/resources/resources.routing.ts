import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {ResourceEditNavigationComponent} from './resource-edit-navigation.component';
import {ResourceEditCanDeactivateGuard}  from './resource-edit-can-deactivate-guard';

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
                component: ResourceEditNavigationComponent,
                canDeactivate: [ResourceEditCanDeactivateGuard]
            },
            {
                path: ':id/edit',
                component: ResourceEditNavigationComponent,
                canDeactivate: [ResourceEditCanDeactivateGuard]
            }
        ]
    }
];

export const resourcesRouting: ModuleWithProviders = RouterModule.forChild(routes);