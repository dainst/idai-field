import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {imagesRouting} from "./images.routing";
import {ImagesComponent} from "./images.component";
import {ImagesGridComponent} from "./images-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {ImageEditNavigationComponent} from "./image-edit-navigation.component";
import {WidgetsModule} from '../widgets/widgets.module';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DropAreaComponent} from './drop-area.component';


@NgModule({
    imports: [
        BrowserModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule
    ],
    declarations: [
        DropAreaComponent,
        ImagesComponent,
        ImagesGridComponent,
        ImageViewComponent,
        ImageEditNavigationComponent
    ]
})

export class ImagesModule {}