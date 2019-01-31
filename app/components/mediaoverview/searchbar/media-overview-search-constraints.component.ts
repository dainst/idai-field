import {Component, Renderer2} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from 'idai-components-2';
import {SearchConstraintsComponent} from '../../../widgets/search-constraints.component';
import {MediaOverviewSearchBarComponent} from './media-overview-search-bar.component';
import {MediaOverviewFacade} from '../view/media-overview-facade';


@Component({
    moduleId: module.id,
    selector: 'media-overview-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class MediaOverviewSearchConstraintsComponent extends SearchConstraintsComponent {

    constructor(mediaOverviewSearchBarComponent: MediaOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                renderer: Renderer2,
                i18n: I18n,
                private mediaOverviewFacade: MediaOverviewFacade) {

        super(mediaOverviewSearchBarComponent, projectConfiguration, renderer, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return this.mediaOverviewFacade.getCustomConstraints();
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.mediaOverviewFacade.setCustomConstraints(constraints);
    }
}