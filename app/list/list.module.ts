import {NgModule} from '@angular/core';
import {ListComponent} from './list.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {BrowserModule} from '@angular/platform-browser';
import {ResourcesModule} from '../resources/resources.module';
import {IdaiDocumentsModule} from 'idai-components-2/documents';

@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        ResourcesModule,
        IdaiDocumentsModule
    ],
    declarations: [
        ListComponent
    ],
    providers: [
        
    ]
})

export class ListModule {}