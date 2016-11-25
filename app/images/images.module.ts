import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {imagesRouting} from "./images.routing";
import {ImagesComponent} from "./images.component";
import {ImagesGridComponent} from "./images-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {ImageEditNavigationComponent} from "./image-edit-navigation.component";
import {GeoreferenceViewComponent} from "./georeference-view.component";
import {WidgetsModule} from '../widgets/widgets.module';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {LinkModalComponent} from './link-modal.component'


@NgModule({
    imports: [
        BrowserModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule
    ],
    declarations: [
        ImagesComponent,
        ImagesGridComponent,
        ImageViewComponent,
        ImageEditNavigationComponent,
        GeoreferenceViewComponent,
        LinkModalComponent
    ],
    entryComponents: [
        LinkModalComponent
    ]
})

export class ImagesModule {}