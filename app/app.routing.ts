import {Routes,RouterModule} from '@angular/router';
import {ResourcesComponent} from './components/resources/resources.component';
import {ImportComponent} from './components/import/import.component';
import {BackupCreationComponent} from './components/backup/backup-creation.component';
import {BackupLoadingComponent} from './components/backup/backup-loading.component';
import {SettingsComponent} from './components/settings/settings.component';
import {MatrixViewComponent} from './components/matrix/matrix-view.component';
import {HelpComponent} from './components/help/help.component';
import {ExportComponent} from './components/export/export.component';

const routes: Routes = [
    { path: '', redirectTo: 'resources/project', pathMatch: 'full' },
    { path: 'resources/:view', component: ResourcesComponent },
    { path: 'resources/:view/:id', component: ResourcesComponent },
    { path: 'resources/:view/:id/:menu', component: ResourcesComponent },
    { path: 'resources/:view/:id/:menu/:tab', component: ResourcesComponent },
    { path: 'matrix', component: MatrixViewComponent },
    { path: 'help', component: HelpComponent },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'backup-creation', component: BackupCreationComponent },
    { path: 'backup-loading', component: BackupLoadingComponent },
    { path: 'settings', component: SettingsComponent }
];

export const routing = RouterModule.forRoot(routes);