import {NgModule} from '@angular/core';
import {ListComponent} from './list.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {FormsModule} from '@angular/forms';
import {IdaiWidgetsModule} from "idai-components-2/widgets"

@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        IdaiDocumentsModule,
        FormsModule,
        IdaiWidgetsModule
    ],
    declarations: [
        ListComponent
    ],
    providers: [
        
    ]
})

export class ListModule {}