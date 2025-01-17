import { clone } from 'tsfun';
import { Component, Renderer2 } from '@angular/core';
import { Datastore, Field, ProjectConfiguration, Labels } from 'idai-field-core';
import { ImageOverviewFacade } from '../../../../components/image/overview/view/imageoverview-facade';
import { SearchConstraintsComponent } from '../../../widgets/search-constraints.component';
import { ImageOverviewSearchBarComponent } from './image-overview-search-bar.component';


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
                labels: Labels) {

        super(imageOverviewSearchBarComponent, projectConfiguration, datastore, renderer, labels);
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
