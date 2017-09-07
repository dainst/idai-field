import {Routes,RouterModule} from '@angular/router';
import {ResourcesComponent} from './resources/resources.component';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from'./export/export.component';
import {SettingsComponent} from './settings/settings.component';

const routes: Routes = [
    { path: '', redirectTo: 'resources/project', pathMatch: 'full' },
    { path: 'resources/:view', component: ResourcesComponent },
    { path: 'resources/:view/:id', component: ResourcesComponent },
    { path: 'resources/:view/:id/:menu/:tab', component: ResourcesComponent },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'settings', component: SettingsComponent }
];

export const routing = RouterModule.forRoot(routes);