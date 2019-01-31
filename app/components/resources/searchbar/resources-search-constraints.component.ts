import {Component, Renderer2} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from 'idai-components-2';
import {SearchConstraintsComponent} from '../../../widgets/search-constraints.component';
import {ResourcesSearchBarComponent} from './resources-search-bar.component';
import {ViewFacade} from '../view/view-facade';


@Component({
    moduleId: module.id,
    selector: 'resources-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchConstraintsComponent extends SearchConstraintsComponent {

    constructor(resourcesSearchBarComponent: ResourcesSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                renderer: Renderer2,
                i18n: I18n,
                private viewFacade: ViewFacade) {

        super(resourcesSearchBarComponent, projectConfiguration, renderer, i18n);

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            if (this.type) this.reset();
        });
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return this.viewFacade.getCustomConstraints();
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.viewFacade.setCustomConstraints(constraints);
    }
}