import {Routes,RouterModule} from '@angular/router';

import {OverviewComponent} from './overview/overview.component';
import {ImportComponent} from './import/import.component';

const appRoutes: Routes = [
    { path: '', component: OverviewComponent },
    { path: 'import', component: ImportComponent }
];

export const routing = RouterModule.forRoot(appRoutes);