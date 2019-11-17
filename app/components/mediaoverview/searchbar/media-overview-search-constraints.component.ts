import {Component, Renderer2} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SearchConstraintsComponent} from '../../../widgets/search-constraints.component';
import {MediaOverviewSearchBarComponent} from './media-overview-search-bar.component';
import {MediaOverviewFacade} from '../view/media-overview-facade';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {clone} from '../../../core/util/object-util';


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

    protected defaultFields: Array<FieldDefinition> = [
        {
            name: 'depicts',
            label: this.i18n({
                id: 'imageOverview.searchBar.constraints.linkedResources',
                value: 'Verknüpfte Ressourcen'
            }),
            inputType: 'default',
            constraintIndexed: true,
            group: ''
        }
    ];

    constructor(mediaOverviewSearchBarComponent: MediaOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                datastore: DocumentReadDatastore,
                renderer: Renderer2,
                i18n: I18n,
                private mediaOverviewFacade: MediaOverviewFacade) {

        super(mediaOverviewSearchBarComponent, projectConfiguration, datastore, renderer, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return clone(this.mediaOverviewFacade.getCustomConstraints());
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.mediaOverviewFacade.setCustomConstraints(constraints);
    }
}