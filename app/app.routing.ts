import {Routes,RouterModule} from '@angular/router';

import {ImportComponent} from './import/import.component';
import {MapWrapperComponent} from './map/map-wrapper.component';

const appRoutes: Routes = [
    { path: 'import', component: ImportComponent },
    { path: 'map', component: MapWrapperComponent },
    { path: '', component: MapWrapperComponent }
];

export const routing = RouterModule.forRoot(appRoutes);