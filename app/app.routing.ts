import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {DocumentEditCanDeactivateGuard}  from './resources/document-edit-can-deactivate-guard';

const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent }
];

export const appRoutingProviders: any[] = [
    DocumentEditCanDeactivateGuard
];

export const routing = RouterModule.forRoot(routes);