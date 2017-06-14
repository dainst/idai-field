import {Routes,RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources/resources.component';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from'./export/export.component';
import {SettingsComponent} from './settings/settings.component';

const routes: Routes = [
    { path: '', redirectTo: 'resources', pathMatch: 'full' },
    { path: 'resources', component: ResourcesComponent },
    { path: 'resources/edit/:tab/:id', component: ResourcesComponent },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'settings', component: SettingsComponent }
];

export const routing = RouterModule.forRoot(routes);