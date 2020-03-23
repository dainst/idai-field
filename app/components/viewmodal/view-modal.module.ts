import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewModalComponent} from './image/image-view-modal.component';
import {ResourceViewModalComponent} from './resource/resource-view-modal.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {ImageGridModule} from '../image/grid/image-grid.module';
import {ImageDocumentsManager} from '../../core/images/overview/view/image-documents-manager';
import {ImageOverviewFacade} from '../../core/images/overview/view/imageoverview-facade';
import {ImagesState} from '../../core/images/overview/view/images-state';
import {ImageReadDatastore} from '../../core/datastore/field/image-read-datastore';
import {ProjectCategories} from '../../core/configuration/project-categories';
import {PersistenceHelper} from '../../core/images/overview/service/persistence-helper';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {UsernameProvider} from '../../core/settings/username-provider';
import {Imagestore} from '../../core/images/imagestore/imagestore';
import {ImageRowModule} from '../image/row/image-row.module';
import {ImageViewerModule} from '../image/viewer/image-viewer.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule,
        ImageRowModule,
        ImageViewerModule
    ],
    declarations: [
        ImageViewModalComponent,
        ResourceViewModalComponent
    ],
    providers: [
        {
            provide: ImageDocumentsManager,
            useClass: ImageDocumentsManager,
            deps: [ImagesState, ImageReadDatastore]
        },
        {
            provide: ImageOverviewFacade,
            useClass: ImageOverviewFacade,
            deps: [ImageDocumentsManager, ImagesState, ProjectCategories]
        },
        {
            provide: PersistenceHelper,
            useClass: PersistenceHelper,
            deps: [ImageOverviewFacade, PersistenceManager, UsernameProvider, Imagestore]
        }
    ],
    entryComponents: [
        ImageViewModalComponent,
        ResourceViewModalComponent
    ]
})

export class ViewModalModule {}