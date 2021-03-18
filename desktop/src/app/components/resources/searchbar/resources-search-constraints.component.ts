import {Component, Renderer2} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ResourcesSearchBarComponent} from './resources-search-bar.component';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {SearchConstraintsComponent} from '../../widgets/search-constraints.component';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {clone} from '../../../core/util/object-util';
import {ViewFacade} from '../../../core/resources/view/view-facade';


@Component({
    selector: 'resources-search-constraints',
    templateUrl: '../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchConstraintsComponent extends SearchConstraintsComponent {

    protected defaultFields: Array<FieldDefinition>;

    constructor(resourcesSearchBarComponent: ResourcesSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                datastore: DocumentReadDatastore,
                renderer: Renderer2,
                i18n: I18n,
                private viewFacade: ViewFacade) {

        super(resourcesSearchBarComponent, projectConfiguration, datastore, renderer, i18n);

        this.initializeDefaultFields();

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            if (this.category) this.reset();
        });
    }


    private initializeDefaultFields() {

        this.defaultFields = [];

        if (!this.viewFacade.isInTypesManagement()) {
            this.defaultFields.push({
                name: 'geometry',
                label: this.i18n({ id: 'resources.searchBar.constraints.geometry', value: 'Geometrie' }),
                inputType: 'default',
                constraintIndexed: true,
                group: ''
            });
        }

        this.defaultFields.push({
            name: 'isDepictedIn',
            label: this.i18n({
                id: 'resources.searchBar.constraints.linkedImages',
                value: 'Verknüpfte Bilder'
            }),
            inputType: 'default',
            constraintIndexed: true,
            group: ''
        });
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return clone(this.viewFacade.getCustomConstraints());
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        this.viewFacade.setLimitSearchResults(true);
        return this.viewFacade.setCustomConstraints(constraints);
    }
}
