import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {BackupCreationComponent} from './backup-creation.component';
import {BackupLoadingComponent} from './backup-loading.component';
import {BackupCreationModalComponent} from './backup-creation-modal.component';
import {BackupLoadingModalComponent} from './backup-loading-modal.component';
import {DialogProvider} from './dialog-provider';
import {ConcreteDialogProvider} from './concrete-dialog-provider';
import {BackupProvider} from './backup-provider';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule
    ],
    declarations: [
        BackupCreationComponent,
        BackupLoadingComponent,
        BackupCreationModalComponent,
        BackupLoadingModalComponent
    ],
    exports: [
        BackupCreationComponent,
        BackupLoadingComponent
    ],
    providers: [
        { provide: DialogProvider, useClass: ConcreteDialogProvider },
        BackupProvider
    ]
})

export class BackupModule {}