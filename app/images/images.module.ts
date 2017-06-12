import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {imagesRouting} from './images.routing';
import {ImagesComponent} from './images.component';
import {ImageGridComponent} from './image-grid.component';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {LinkModalComponent} from './link-modal.component'
import {DropAreaComponent} from './drop-area.component';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'


@NgModule({
    imports: [
        BrowserModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule
    ],
    declarations: [
        ImagesComponent,
        ImageGridComponent,
        ImageViewComponent,
        GeoreferenceViewComponent,
        LinkModalComponent,
        DropAreaComponent,
        ImageTypePickerModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        ImageTypePickerModalComponent
    ]
})

export class ImagesModule {}