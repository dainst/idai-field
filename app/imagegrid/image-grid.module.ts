import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {ImageGridComponent} from './image-grid.component';
import {DropAreaComponent} from './drop-area.component';
import {ImageGridBuilder} from './image-grid-builder';
import {Imagestore} from '../imagestore/imagestore';
import {ImageUploadModule} from '../imageupload/image-upload.module';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiWidgetsModule,
        IdaiDocumentsModule,
        RouterModule,
        IdaiMessagesModule,
        ImageUploadModule
    ],
    declarations: [
        ImageGridComponent,
        DropAreaComponent
    ],
    providers: [
        {
            provide: ImageGridBuilder,
            useFactory: (imageStore: Imagestore) => {
                return new ImageGridBuilder(imageStore, true);
            },
            deps: [Imagestore]
        },
    ],
    exports: [
        ImageGridComponent, // export necessary?
    ]
})

export class ImageGridModule { }