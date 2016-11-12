import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {imageOverviewRouting} from "./image-overview.routing";
import {ImageOverviewComponent} from "./image-overview.component";
import {ImageGridComponent} from "./image-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {WidgetsModule} from '../widgets/widgets.module';

@NgModule({
    imports: [
        BrowserModule,
        imageOverviewRouting,
        WidgetsModule
    ],
    declarations: [
        ImageOverviewComponent,
        ImageGridComponent,
        ImageViewComponent
    ]
})

export class ImagesModule {}