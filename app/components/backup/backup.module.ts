import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {BackupComponent} from './backup.component';
import {DumpModalComponent} from './dump-modal.component';
import {ReadDumpModalComponent} from './read-dump-modal.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DialogProvider} from './dialog-provider';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule.forRoot()
    ],
    declarations: [
        BackupComponent,
        DumpModalComponent,
        ReadDumpModalComponent
    ],
    exports: [
        BackupComponent
    ],
    providers: [
        DialogProvider,
    ],
    entryComponents: [
        DumpModalComponent,
        ReadDumpModalComponent
    ]
})

export class BackupModule {}