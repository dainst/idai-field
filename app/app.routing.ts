import {Routes,RouterModule} from '@angular/router';

import {ImageOverviewComponent} from './overview/image-overview/image-overview.component';
import {ImportComponent} from './import/import.component';
import {CanDeactivateDocumentEditWrapperGuard} from './overview/can-deactivate-document-edit-wrapper-guard';


const appRoutes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'images', component: ImageOverviewComponent},
    { path: 'import', component: ImportComponent }
];

export const appRoutingProviders: any[] = [
    CanDeactivateDocumentEditWrapperGuard
];

export const routing = RouterModule.forRoot(appRoutes);