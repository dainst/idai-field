import {Component, ElementRef, Input} from '@angular/core';
import {SearchBarComponent} from '../../widgets/search-bar.component';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';


@Component({
    selector: 'resources-search-bar',
    templateUrl: './resources-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchBarComponent extends SearchBarComponent {

    @Input() extendedSearch: boolean;

    public suggestionsVisible: boolean = false;


    constructor(private elementRef: ElementRef, projectConfiguration: ProjectConfiguration) {

        super(projectConfiguration);
    }


    public getSelectedCategory(): string|undefined {

        return this.categories !== undefined && this.categories.length > 0 ? this.categories[0] : undefined
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    public isCategorySelected(): boolean {

        return this.categories !== undefined && this.categories.length > 0;
    }


    public handleClick(event: Event) {

        let target: any = event.target;
        let insideFilterMenu: boolean = false;
        let insideSearchBarComponent: boolean = false;

        do {
            if (target.id === 'resources-search-bar-filter-button') insideFilterMenu = true;
            if (target === this.elementRef.nativeElement) insideSearchBarComponent = true;

            target = target.parentNode;
        } while (target);

        if (!insideFilterMenu && this.popover) this.popover.close();
        if (!insideSearchBarComponent) this.hideSuggestions();
    }
}
