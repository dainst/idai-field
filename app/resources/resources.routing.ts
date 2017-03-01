import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {EditNavigationComponent} from './edit-navigation.component';
import {EditCanDeactivateGuard}  from './edit-can-deactivate-guard';

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
                component: EditNavigationComponent,
                canDeactivate: [EditCanDeactivateGuard]
            },
            {
                path: ':id/edit',
                component: EditNavigationComponent,
                canDeactivate: [EditCanDeactivateGuard]
            }
        ]
    }
];

export const resourcesRouting: ModuleWithProviders = RouterModule.forChild(routes);