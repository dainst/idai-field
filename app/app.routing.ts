import {Routes,RouterModule} from '@angular/router';
import {ListWrapperComponent} from './list/list-wrapper.component';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from'./export/export.component';
import {EditCanDeactivateGuard as guard1}  from './resources/edit-can-deactivate-guard';
import {EditCanDeactivateGuard as guard2}  from './images/edit-can-deactivate-guard';
import {SettingsComponent} from "./settings/settings.component";

const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'list', component: ListWrapperComponent },
    { path: 'settings', component: SettingsComponent }
];

export const appRoutingProviders: any[] = [
    guard1,
    guard2
];

export const routing = RouterModule.forRoot(routes);