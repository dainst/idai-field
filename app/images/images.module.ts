import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {imagesRouting} from "./images.routing";
import {ImagesComponent} from "./images.component";
import {ImagesGridComponent} from "./images-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {ImageEditComponent} from "./image-edit.component";
import {WidgetsModule} from '../widgets/widgets.module';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';

@NgModule({
    imports: [
        BrowserModule,
        imagesRouting,
        WidgetsModule,
        IdaiComponents2Module
    ],
    declarations: [
        ImagesComponent,
        ImagesGridComponent,
        ImageViewComponent,
        ImageEditComponent
    ]
})

export class ImagesModule {}