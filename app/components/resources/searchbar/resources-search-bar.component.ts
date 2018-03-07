import {Component, ElementRef} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {SearchBarComponent} from '../../../widgets/search-bar.component';

@Component({
    moduleId: module.id,
    selector: 'resources-search-bar',
    templateUrl: './resources-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchBarComponent extends SearchBarComponent {

    private suggestionsVisible: boolean = false;


    constructor(private elementRef: ElementRef,
                projectConfiguration: ProjectConfiguration) {

        super(projectConfiguration);
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    protected handleClick(event: Event) {

        let target: any = event.target;
        let insideFilterMenu: boolean = false;
        let insideSearchBarComponent: boolean = false;

        do {
            if (target.id === 'filter-button') insideFilterMenu = true;
            if (target === this.elementRef.nativeElement) insideSearchBarComponent = true;

            target = target.parentNode;
        } while (target);

        if (!insideFilterMenu && this.popover) this.popover.close();
        if (!insideSearchBarComponent) this.hideSuggestions();
    }
}