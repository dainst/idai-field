import {Component, ElementRef, ViewChild} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {SearchBarComponent} from '../../../widgets/search-bar.component';
import {TypeUtility} from '../../../core/model/type-utility';
import {ViewFacade} from '../view/view-facade';

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

    @ViewChild('searchInput') fulltextSearchInput: ElementRef;

    private suggestionsVisible: boolean = false;


    constructor(private elementRef: ElementRef,
                private viewFacade: ViewFacade,
                projectConfiguration: ProjectConfiguration, typeUtility: TypeUtility) {

        super(projectConfiguration, typeUtility);
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    public onKeyUp(event: KeyboardEvent) {

        this.onQueryStringChanged.emit(this.q);
    }


    public isTypeSelected(): boolean {

        return this.types !== undefined && this.types.length > 0;
    }


    public isFocused(): boolean {

        return this.fulltextSearchInput.nativeElement.ownerDocument.activeElement
            === this.fulltextSearchInput.nativeElement;
    }


    public showSearchConstraintsOption(): boolean {

        return this.viewFacade.getBypassHierarchy();
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