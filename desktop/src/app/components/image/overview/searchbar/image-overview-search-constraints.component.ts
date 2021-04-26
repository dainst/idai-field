import { Component, Renderer2 } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone } from 'tsfun'
import { Datastore, FieldDefinition } from 'idai-field-core';
import { ProjectConfiguration } from '../../../../core/configuration/project-configuration';
import { ImageOverviewFacade } from '../../../../core/images/overview/view/imageoverview-facade';
import { SearchConstraintsComponent } from '../../../widgets/search-constraints.component';
import { ImageOverviewSearchBarComponent } from './image-overview-search-bar.component';


@Component({
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

    constructor(imageOverviewSearchBarComponent: ImageOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                datastore: Datastore,
                renderer: Renderer2,
                i18n: I18n,
                private imageOverviewFacade: ImageOverviewFacade) {

        super(imageOverviewSearchBarComponent, projectConfiguration, datastore, renderer, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return clone(this.imageOverviewFacade.getCustomConstraints());
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }
}
