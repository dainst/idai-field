import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {imagesRouting} from './image-overview.routing';
import {ImageOverviewComponent} from './image-overview.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ImageGridModule} from '../grid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewTaskbarComponent} from './image-overview-taskbar.component';
import {ImageOverviewSearchBarComponent} from './searchbar/image-overview-search-bar.component';
import {ImageOverviewSearchConstraintsComponent} from './searchbar/image-overview-search-constraints.component';
import {DeleteModalComponent} from './delete-modal.component';
import {PersistenceHelper} from '../../../core/images/overview/service/persistence-helper';
import {ImageOverviewFacade} from '../../../core/images/overview/view/imageoverview-facade';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {ImageDocumentsManager} from '../../../core/images/overview/view/image-documents-manager';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {SettingsProvider} from '../../../core/settings/settings-provider';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageOverviewComponent,
        ImageOverviewTaskbarComponent,
        ImageOverviewSearchBarComponent,
        ImageOverviewSearchConstraintsComponent,
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent
    ],
    providers: [
        ImagesState,
        {
            provide: PersistenceHelper,
            useClass: PersistenceHelper,
            deps: [ImageOverviewFacade, PersistenceManager, SettingsProvider, Imagestore]
        },
        {
            provide: ImageDocumentsManager,
            useClass: ImageDocumentsManager,
            deps: [ImagesState, ImageReadDatastore]
        },
        {
            provide: ImageOverviewFacade,
            useClass: ImageOverviewFacade,
            deps: [ImageDocumentsManager, ImagesState, ProjectConfiguration]
        }
    ]
})

export class ImageOverviewModule {}
