import {Component} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from 'idai-components-2';
import {SearchConstraintsComponent} from '../../../widgets/search-constraints.component';
import {ImageOverviewSearchBarComponent} from './image-overview-search-bar.component';
import {ImageOverviewFacade} from '../view/imageoverview-facade';


@Component({
    moduleId: module.id,
    selector: 'image-overview-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ImageOverviewSearchConstraintsComponent extends SearchConstraintsComponent {

    constructor(resourcesSearchBarComponent: ImageOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                i18n: I18n,
                private imageOverviewFacade: ImageOverviewFacade) {

        super(resourcesSearchBarComponent, projectConfiguration, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return this.imageOverviewFacade.getCustomConstraints();
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }
}