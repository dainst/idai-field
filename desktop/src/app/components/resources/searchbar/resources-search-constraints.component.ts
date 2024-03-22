import { clone } from 'tsfun';
import { Component, Renderer2 } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Datastore, Field, ProjectConfiguration, Labels } from 'idai-field-core';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { SearchConstraintsComponent } from '../../widgets/search-constraints.component';
import { ResourcesSearchBarComponent } from './resources-search-bar.component';


@Component({
    selector: 'resources-search-constraints',
    templateUrl: '../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchConstraintsComponent extends SearchConstraintsComponent {

    protected defaultFields: Array<Field>;

    constructor(resourcesSearchBarComponent: ResourcesSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                datastore: Datastore,
                renderer: Renderer2,
                i18n: I18n,
                private viewFacade: ViewFacade,
                labels: Labels) {

        super(resourcesSearchBarComponent, projectConfiguration, datastore, renderer, labels, i18n);

        this.initializeDefaultFields();

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            if (this.category) this.reset();
        });
    }


    public getFieldLabel(field: Field): string {

        switch (field.name) {
            case 'isChildOf':
                return this.i18n({
                    id: 'resources.searchBar.constraints.hasChildren',
                    value: 'Untergeordnete Ressourcen'
                });
            case 'geometry':
                return this.i18n({
                    id: 'resources.searchBar.constraints.geometry',
                    value: 'Geometrie'
                });
            case 'isDepictedIn':
                return this.i18n({
                    id: 'resources.searchBar.constraints.linkedImages',
                    value: 'Verknüpfte Bilder'
                });
            case 'isSameAs':
                return this.i18n({
                    id: 'resources.searchBar.constraints.isSameAs',
                    value: 'Verknüpfte identische Ressourcen'
                });
            case 'isInstanceOf':
                return this.i18n({
                    id: 'resources.searchBar.constraints.isInstanceOf',
                    value: 'Verknüpfte Typen'
                });
            case 'hasInstance':
                return this.i18n({
                    id: 'resources.searchBar.constraints.hasInstance',
                    value: 'Verknüpfte Funde'
                });
            case 'isStoragePlaceOf':
                return this.i18n({
                    id: 'resources.searchBar.constraints.isStoragePlaceOf',
                    value: 'Verknüpfte Objekte'
                });
            case 'isStoredIn':
                return this.i18n({
                    id: 'resources.searchBar.constraints.isStoredIn',
                    value: 'Verknüpfter Aufbewahrungsort'
                });
            default:
                return super.getFieldLabel(field);
        }
    }


    private initializeDefaultFields() {

        this.defaultFields = [];

        this.defaultFields.push({
            name: 'isChildOf',
            inputType: 'default',
            constraintIndexed: true
        });

        if (!this.viewFacade.isInTypesManagement()) {
            this.defaultFields.push({
                name: 'geometry',
                inputType: 'default',
                constraintIndexed: true
            });
        }

        this.defaultFields.push({
            name: 'isDepictedIn',
            inputType: 'default',
            constraintIndexed: true
        });

        if (this.viewFacade.isInTypesManagement()) {
            this.defaultFields.push({
                name: 'hasInstance',
                inputType: 'default',
                constraintIndexed: true
            });
        } else if (this.viewFacade.isInInventoryManagement()) {
            this.defaultFields.push({
                name: 'isStoragePlaceOf',
                inputType: 'default',
                constraintIndexed: true
            });
        } else {
            this.defaultFields.push({
                name: 'isInstanceOf',
                inputType: 'default',
                constraintIndexed: true
            });
            this.defaultFields.push({
                name: 'isStoredIn',
                inputType: 'default',
                constraintIndexed: true
            });
            this.defaultFields.push({
                name: 'isSameAs',
                inputType: 'default',
                constraintIndexed: true
            });
        }
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return clone(this.viewFacade.getCustomConstraints());
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        this.viewFacade.setLimitSearchResults(true);
        return this.viewFacade.setCustomConstraints(constraints);
    }
}
