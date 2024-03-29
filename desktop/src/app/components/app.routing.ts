import { Routes, RouterModule } from '@angular/router';
import { ResourcesComponent } from './resources/resources.component';
import { ImportComponent } from './import/import.component';
import { BackupCreationComponent } from './backup/backup-creation.component';
import { BackupLoadingComponent } from './backup/backup-loading.component';
import { SettingsComponent } from './settings/settings.component';
import { MatrixViewComponent } from './matrix/matrix-view.component';
import { HelpComponent } from './help/help.component';
import { ExportComponent } from './export/export.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { DownloadProjectComponent } from './project/download-project.component';
import { ConfigurationGuard } from './configuration/configuration-guard';


const routes: Routes = [
    { path: '', redirectTo: 'resources/project', pathMatch: 'full' },
    { path: 'resources/:view', component: ResourcesComponent },
    { path: 'resources/:view/:id', component: ResourcesComponent },
    { path: 'resources/:view/:id/:menu', component: ResourcesComponent },
    { path: 'resources/:view/:id/:menu/:group', component: ResourcesComponent },
    { path: 'matrix', component: MatrixViewComponent },
    { path: 'help', component: HelpComponent },
    { path: 'downloadProject', component: DownloadProjectComponent },
    { path: 'import', component: ImportComponent },
    { path: 'export', component: ExportComponent },
    { path: 'backup-creation', component: BackupCreationComponent },
    { path: 'backup-loading', component: BackupLoadingComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'configuration', component: ConfigurationComponent, canDeactivate: [ConfigurationGuard] }
];

export const routing = RouterModule.forRoot(routes);
