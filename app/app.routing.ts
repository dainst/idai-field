import {Routes,RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources/resources.component';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from'./export/export.component';
import {SettingsComponent} from './settings/settings.component';

const routes: Routes = [
    // TODO This should not be hardcoded
    { path: '', redirectTo: 'resources/excavation', pathMatch: 'full' },

    { path: 'resources/:view', component: ResourcesComponent },
    { path: 'resources/:view/edit/:tab/:id', component: ResourcesComponent },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'settings', component: SettingsComponent }
];

export const routing = RouterModule.forRoot(routes);