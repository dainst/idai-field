import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DeleteProjectModalComponent } from './delete-project-modal.component';
import { CreateProjectModalComponent } from './create-project-modal.component';
import { SynchronizationModalComponent } from './synchronization-modal.component';


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
        SynchronizationModalComponent
    ],
    providers: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent
    ],
    entryComponents: [
        CreateProjectModalComponent,
        DeleteProjectModalComponent,
        SynchronizationModalComponent
    ]
})

export class ProjectModule {}
