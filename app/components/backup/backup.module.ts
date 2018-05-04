import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {BackupComponent} from './backup.component';
import {Backup} from './backup';
import {DumpModalComponent} from './dump-modal.component';
import {ReadDumpModalComponent} from './read-dump-modal.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
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
        Backup
    ],
    entryComponents: [
        DumpModalComponent,
        ReadDumpModalComponent
    ]
})

export class BackupModule {}