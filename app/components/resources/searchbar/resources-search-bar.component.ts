import {Component, ElementRef, Input, SimpleChanges} from '@angular/core';
import {ProjectConfiguration, IdaiType} from 'idai-components-2';
import {SearchBarComponent} from '../../../widgets/search-bar.component';
import {TypeUtility} from '../../../core/model/type-utility';
import {ViewFacade} from '../view/view-facade';

@Component({
    moduleId: module.id,
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


    constructor(private elementRef: ElementRef,
                private viewFacade: ViewFacade,
                private typeUtility: TypeUtility,
                projectConfiguration: ProjectConfiguration) {

        super(projectConfiguration);
    }


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['relationName'] || changes['relationRangeType'] || changes['parentType'] ||
            changes['showFiltersMenu'] || changes['extendedSearch']) {
            this.initializeFilterOptions();
        }
    }


    public getSelectedType(): string|undefined {

        return this.types !== undefined && this.types.length > 0 ? this.types[0] : undefined
    }


    public showSuggestions() {

        this.suggestionsVisible = true;
    }


    public hideSuggestions() {

        this.suggestionsVisible = false;
    }


    public isTypeSelected(): boolean {

        return this.types !== undefined && this.types.length > 0;
    }


    protected initializeFilterOptions() {

        this.filterOptions = [];

        if (this.viewFacade.isInOverview()) {
            this.addFilterTypesForOverview();
        } else {
            this.addFilterOptionsFromConfiguration();
        }
    }


    private addFilterTypesForOverview() {

        const types: Array<IdaiType> = this.extendedSearch ?
            this.typeUtility.getNonImageTypes().filter(type => !type.parentType) :
            this.typeUtility.getOverviewTopLevelTypes();

        types.forEach(type => this.addFilterOption(type));
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