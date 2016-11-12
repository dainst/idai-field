import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {ResourceEditCanDeactivateGuard}  from './resources/resource-edit-can-deactivate-guard';

const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent }
];

export const appRoutingProviders: any[] = [
    ResourceEditCanDeactivateGuard
];

export const routing = RouterModule.forRoot(routes);