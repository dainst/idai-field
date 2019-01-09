import {Component, Renderer2} from '@angular/core';
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

    constructor(imageOverviewSearchBarComponent: ImageOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                renderer: Renderer2,
                i18n: I18n,
                private imageOverviewFacade: ImageOverviewFacade) {

        super(imageOverviewSearchBarComponent, projectConfiguration, renderer, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return this.imageOverviewFacade.getCustomConstraints();
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }
}