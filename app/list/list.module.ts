import {NgModule} from '@angular/core';
import {ListWrapperComponent} from './list-wrapper.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {FormsModule} from '@angular/forms';
import {IdaiWidgetsModule} from "idai-components-2/widgets"
import {ResourcesModule} from "../resources/resources.module"

@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        IdaiDocumentsModule,
        FormsModule,
        IdaiWidgetsModule,
        ResourcesModule
    ],
    declarations: [
        ListWrapperComponent
    ],
    providers: [
        
    ]
})

export class ListModule {}