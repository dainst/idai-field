import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {View3DComponent} from './view-3d.component';

const routes: Routes = [
    {
        path: '3d/:id/:menu',
        component: View3DComponent
    },
    {
        path: '3d/:id/:menu/:tab',
        component: View3DComponent
    }
];

export const view3DRouting: ModuleWithProviders = RouterModule.forChild(routes);