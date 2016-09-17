import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {MapComponent} from './map/map.component';

const appRoutes: Routes = [
    { path: 'import', component: ImportComponent },
    { path: 'map', component: MapComponent },
    { path: '', component: MapComponent }
];

export const routing = RouterModule.forRoot(appRoutes);