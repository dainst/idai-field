import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ProjectConfiguration, FieldDefinition} from 'idai-components-2/core';
import {ViewFacade} from '../view/view-facade';
import {ResourcesSearchBarComponent} from './resources-search-bar.component';


type ConstraintListItem = { name: string; fieldName: string, label: string; searchTerm: string };


@Component({
    moduleId: module.id,
    selector: 'search-constraints',
    templateUrl: './search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsComponent implements OnChanges {

    @Input() type: string;

    public fields: Array<FieldDefinition>;
    public selectedField: FieldDefinition|undefined;
    public searchTerm: string = '';
    public constraintListItems: Array<ConstraintListItem> = [];
    public showConstraintsMenu: boolean = false;

    private static textFieldInputTypes: string[] = ['input', 'text', 'unsignedInt', 'float', 'unsignedFloat'];


    constructor(public resourcesSearchBarComponent: ResourcesSearchBarComponent,
                private projectConfiguration: ProjectConfiguration,
                private viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            if (this.type) this.reset();
        });
    }


    ngOnChanges(changes: SimpleChanges): void {

        this.reset();
    }


    public getTooltip() {

        return this.constraintListItems.length === 0
            ? 'Weitere Suchkriterien einstellen'
            : 'Aktive Suchkriterien';
    }


    public getSearchInputType(field: FieldDefinition|undefined): 'input'|'dropdown'|undefined {

        if (!field) return undefined;

        if (SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType as string)) {
            return 'input';
        } else if (field.inputType === 'dropdown') {
            return 'dropdown';
        } else {
            return undefined;
        }
    }


    public selectField(fieldName: string) {

        this.selectedField = this.fields.find(field => field.name === fieldName);
    }


    public async addConstraint() {

        if (!this.selectedField || this.searchTerm.length == 0) return;

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        constraints[this.selectedField.name + ':match'] = this.searchTerm;
        await this.viewFacade.setCustomConstraints(constraints);

        this.reset();
    }


    public async removeConstraint(constraintName: string) {

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        delete constraints[constraintName];
        await this.viewFacade.setCustomConstraints(constraints);

        this.reset();
    }


    private reset() {

        this.updateConstraintListItems();
        this.updateFields();
        this.removeUserEntries();
    }


    private updateConstraintListItems() {

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        this.constraintListItems = Object.keys(constraints)
            .map(constraintName => {
                return {
                    name: constraintName,
                    fieldName: SearchConstraintsComponent.getFieldName(constraintName),
                    label: this.getLabel(constraintName),
                    searchTerm: constraints[constraintName]
                }
            });
    }


    private updateFields() {

        this.fields = this.projectConfiguration.getFieldDefinitions(this.type)
            .filter(field => {
                return field.constraintIndexed
                    && this.getSearchInputType(field)
                    && !this.constraintListItems.find(item => item.fieldName === field.name);
            });
    }


    private removeUserEntries() {

        this.selectedField = undefined;
        this.searchTerm = '';
    }


    private getLabel(constraintName: string): string {

        return this.projectConfiguration.getTypesMap()[this.type].fields
            .find((field: FieldDefinition) => {
                return field.name === SearchConstraintsComponent.getFieldName(constraintName);
            }).label;
    }


    private handleClick(event: Event) {

        if (!this.showConstraintsMenu) return;

        let target: any = event.target;

        do {
            if (target.id && target.id.startsWith('constraints-menu')) return;
            target = target.parentNode;
        } while (target);

        this.showConstraintsMenu = false;
        this.reset();
    }


    private static getFieldName(constraintName: string): string {

        return constraintName.substring(0, constraintName.indexOf(':'));
    }
}