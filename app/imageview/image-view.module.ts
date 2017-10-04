import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageViewComponent} from '../imageview/image-view.component';
import {GeoreferenceViewComponent} from '../imageview/georeference-view.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {imageViewRouting} from './image-view.routing';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule,
        imageViewRouting
    ],
    declarations: [
        ImageViewComponent,
        GeoreferenceViewComponent
    ]
})

export class ImageViewModule {}