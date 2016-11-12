import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {CanDeactivateDocumentEditWrapperGuard} from './overview/can-deactivate-document-edit-wrapper-guard';


const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent }
];

export const appRoutingProviders: any[] = [
    CanDeactivateDocumentEditWrapperGuard
];

export const routing = RouterModule.forRoot(routes);