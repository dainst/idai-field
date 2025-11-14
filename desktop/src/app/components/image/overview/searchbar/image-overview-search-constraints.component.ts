import { clone } from 'tsfun';
import { Component, Renderer2 } from '@angular/core';
import { Datastore, Field, ProjectConfiguration, Labels } from 'idai-field-core';
import { ImageOverviewFacade } from '../view/image-overview-facade';
import { SearchConstraintsComponent } from '../../../widgets/search-constraints.component';
import { ImageOverviewSearchBarComponent } from './image-overview-search-bar.component';
import { Menus } from '../../../../services/menus';


@Component({
    selector: 'image-overview-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ImageOverviewSearchConstraintsComponent extends SearchConstraintsComponent {

    protected defaultFields: Array<Field> = [
        {
            name: 'depicts',
            inputType: 'default',
            constraintIndexed: true
        }
    ];


    constructor(imageOverviewSearchBarComponent: ImageOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                datastore: Datastore,
                renderer: Renderer2,
                private imageOverviewFacade: ImageOverviewFacade,
                menuService: Menus,
                labels: Labels) {

        super(imageOverviewSearchBarComponent, projectConfiguration, datastore, renderer, menuService, labels);
    }


    public getFieldLabel(field: Field): string {

        return field.name === 'depicts'
            ? $localize `:@@imageOverview.searchBar.constraints.linkedResources:Verknüpfte Ressourcen`
            : super.getFieldLabel(field);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return clone(this.imageOverviewFacade.getCustomConstraints());
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }
}
