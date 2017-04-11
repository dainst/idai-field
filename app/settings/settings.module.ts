import {NgModule} from '@angular/core';
import {WidgetsModule} from '../widgets/widgets.module';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {FormsModule} from '@angular/forms';
import {SettingsComponent} from "./settings.component";

@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        IdaiDocumentsModule,
        FormsModule
    ],
    declarations: [
        SettingsComponent
    ],
    providers: [
    ]
})

/**
 * @author Daniel de Oliveira
 */
export class SettingsModule { }