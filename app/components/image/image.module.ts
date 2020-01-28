import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageGridModule} from './grid/image-grid.module';
import {PersistenceHelper} from '../../core/images/overview/service/persistence-helper';
import {ImageOverviewFacade} from '../../core/images/overview/view/imageoverview-facade';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {UsernameProvider} from '../../core/settings/username-provider';
import {Imagestore} from '../../core/images/imagestore/imagestore';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        ImageGridModule
    ],
    declarations: [],
    providers: [
        {
            provide: PersistenceHelper,
            useClass: PersistenceHelper,
            deps: [ImageOverviewFacade, PersistenceManager, UsernameProvider, Imagestore]
        }
    ]
})

export class ImageModule {}