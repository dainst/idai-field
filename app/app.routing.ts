import {Routes,RouterModule} from '@angular/router';
import {ListComponent} from './list/list.component';
import {ImportComponent} from './import/import.component';
import {EditCanDeactivateGuard as guard1}  from './resources/edit-can-deactivate-guard';
import {EditCanDeactivateGuard as guard2}  from './images/edit-can-deactivate-guard';

const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'import', component: ImportComponent },
    { path: 'list', component: ListComponent }
];

export const appRoutingProviders: any[] = [
    guard1,
    guard2
];

export const routing = RouterModule.forRoot(routes);