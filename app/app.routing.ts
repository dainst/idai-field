import {Routes,RouterModule} from '@angular/router';

import {OverviewComponent} from './overview/overview.component';
import {ImportComponent} from './import/import.component';

const appRoutes: Routes = [
    { path: '', name: 'Overview', component: OverviewComponent },
    { path: 'import', name: 'Import', component: ImportComponent }
];

export const routing = RouterModule.forRoot(appRoutes);