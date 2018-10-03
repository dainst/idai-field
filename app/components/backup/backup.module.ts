import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {BackupCreationComponent} from './backup-creation.component';
import {BackupLoadingComponent} from './backup-loading.component';
import {DumpModalComponent} from './dump-modal.component';
import {ReadDumpModalComponent} from './read-dump-modal.component';
import {DialogProvider} from './dialog-provider';
import {ConcreteDialogProvider} from './concrete-dialog-provider';
import {BackupProvider} from './backup-provider';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule.forRoot()
    ],
    declarations: [
        BackupCreationComponent,
        BackupLoadingComponent,
        DumpModalComponent,
        ReadDumpModalComponent
    ],
    exports: [
        BackupCreationComponent,
        BackupLoadingComponent
    ],
    providers: [
        { provide: DialogProvider, useClass: ConcreteDialogProvider },
        BackupProvider
    ],
    entryComponents: [
        DumpModalComponent,
        ReadDumpModalComponent
    ]
})

export class BackupModule {}