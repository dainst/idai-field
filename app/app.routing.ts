import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {CanDeactivateGuard} from './overview/can-deactivate-guard';


const appRoutes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent }
];

export const appRoutingProviders: any[] = [
    CanDeactivateGuard
];

export const routing = RouterModule.forRoot(appRoutes);