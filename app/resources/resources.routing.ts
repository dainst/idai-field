import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources.component';
import {MapWrapperComponent} from './map-wrapper.component';

const routes: Routes = [
    {
        path: 'resources',
        component: ResourcesComponent,
        children: [
            {
                path: '',
                component: MapWrapperComponent
            }
        ]
    }
];

export const resourcesRouting: ModuleWithProviders = RouterModule.forChild(routes);