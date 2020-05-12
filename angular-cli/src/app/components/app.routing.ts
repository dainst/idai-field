import {Routes,RouterModule} from '@angular/router';
import {HelpComponent} from './help/help.component';
import {ProjectConfigurationComponent} from './configuration/project-configuration.component';
// import {ResourcesComponent} from './resources/resources.component';
// import {ImportComponent} from './import/import.component';
// import {BackupCreationComponent} from './backup/backup-creation.component';
// import {BackupLoadingComponent} from './backup/backup-loading.component';
// import {SettingsComponent} from './settings/settings.component';
// import {MatrixViewComponent} from './matrix/matrix-view.component';
// import {HelpComponent} from './help/help.component';
// import {ExportComponent} from './export/export.component';
// import { ProjectConfigurationComponent } from './configuration/project-configuration.component';

const routes: Routes = [

    { path: '', redirectTo: 'configuration', pathMatch: 'full' },
    { path: 'help', component: HelpComponent },

    { path: 'configuration', component: ProjectConfigurationComponent }


  // { path: 'settings', component: SettingsComponent },

    //{ path: '', redirectTo: 'resources/project', pathMatch: 'full' },
    // { path: 'resources/:view', component: ResourcesComponent },
    // { path: 'resources/:view/:id', component: ResourcesComponent },
    // { path: 'resources/:view/:id/:menu', component: ResourcesComponent },
    // { path: 'resources/:view/:id/:menu/:group', component: ResourcesComponent },
    // { path: 'matrix', component: MatrixViewComponent },
    // { path: 'import', component: ImportComponent },
    // { path: 'export', component: ExportComponent },
    // { path: 'backup-creation', component: BackupCreationComponent },
    // { path: 'backup-loading', component: BackupLoadingComponent },
];

export const routing = RouterModule.forRoot(routes);
