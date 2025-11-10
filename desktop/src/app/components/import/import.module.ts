import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ImportComponent } from './import.component';
import { ImportState } from './import-state';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        RouterModule,
    ],
    declarations: [
        ImportComponent
    ],
    providers: [
        ImportState
    ],
    exports: [
        ImportComponent
    ]
})

export class ImportModule {}
