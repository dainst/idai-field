import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DeleteProjectModalComponent } from './delete-project-modal.component';
import { CreateProjectModalComponent } from './create-project-modal.component';
import { SynchronizationModalComponent } from './synchronization-modal.component';
import { DownloadProjectComponent } from './download-project.component';
import { DownloadProjectProgressModalComponent } from './download-project-progress-modal.component';
import { CancelModalComponent } from './cancel-modal.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { ProjectInformationModalComponent } from './project-information-modal.component';
import { DoceditModule } from '../docedit/docedit.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        WidgetsModule,
        DoceditModule
    ],
    declarations: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent,
        ProjectInformationModalComponent,
        DownloadProjectComponent,
        DownloadProjectProgressModalComponent,
        CancelModalComponent
    ],
    providers: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent,
        ProjectInformationModalComponent,
        DownloadProjectComponent,
        DownloadProjectProgressModalComponent,
        CancelModalComponent
    ]
})

export class ProjectModule {}
