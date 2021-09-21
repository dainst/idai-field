import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DeleteProjectModalComponent } from './delete-project-modal.component';
import { CreateProjectModalComponent } from './create-project-modal.component';
import { SynchronizationModalComponent } from './synchronization-modal.component';
import { NetworkProjectComponent } from './network-project.component';
import { NetworkProjectProgressModalComponent } from './network-project-progress-modal.component';
import { CancelModalComponent } from './cancel-modal.component';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
    ],
    declarations: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent,
        NetworkProjectComponent,
        NetworkProjectProgressModalComponent,
        CancelModalComponent
    ],
    providers: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent,
        NetworkProjectComponent,
        NetworkProjectProgressModalComponent,
        CancelModalComponent
    ],
    entryComponents: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent,
        NetworkProjectProgressModalComponent,
        CancelModalComponent
    ]
})

export class ProjectModule {}
