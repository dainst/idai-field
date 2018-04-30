import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {BackupComponent} from './backup.component';
import {Backup} from './backup';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        BackupComponent,
    ],
    exports: [
        BackupComponent
    ],
    providers: [
        Backup
    ]
})

export class BackupModule {}