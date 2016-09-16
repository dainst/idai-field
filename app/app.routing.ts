import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';

const appRoutes: Routes = [
    { path: 'import', component: ImportComponent },
    { path: '', component: ImportComponent }
];

export const routing = RouterModule.forRoot(appRoutes);