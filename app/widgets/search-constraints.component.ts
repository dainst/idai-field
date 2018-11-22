import {Input, OnChanges, SimpleChanges} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration, FieldDefinition} from 'idai-components-2';
import {ConstraintIndexer} from '../core/datastore/index/constraint-indexer';
import {SearchBarComponent} from './search-bar.component';


type ConstraintListItem = {
    name: string;
    fieldName: string,
    label: string;
    searchTerm: string,
    searchInputType?: string
};


/**
 * @author Thomas Kleinke
 */
export abstract class SearchConstraintsComponent implements OnChanges {

    @Input() type: string;

    public fields: Array<FieldDefinition>;
    public selectedField: FieldDefinition|undefined;
    public searchTerm: string = '';
    public constraintListItems: Array<ConstraintListItem> = [];
    public showConstraintsMenu: boolean = false;

    private static textFieldInputTypes: string[] = ['input', 'text', 'unsignedInt', 'float', 'unsignedFloat'];
    private static dropdownInputTypes: string[] = ['dropdown', 'checkboxes'];


    constructor(public searchBarComponent: SearchBarComponent,
                private projectConfiguration: ProjectConfiguration,
                private i18n: I18n) {}


    ngOnChanges(changes: SimpleChanges): void {

        this.reset();
    }


    public getTooltip() {

        return this.constraintListItems.length === 0
            ? this.i18n({
                id: 'resources.searchBar.constraints.tooltips.setupAdditionalSearchCriteria',
                value: 'Weitere Suchkriterien einstellen'
            })
            : this.i18n({
                id: 'resources.searchBar.constraints.tooltips.activeSearchCriteria',
                value: 'Aktive Suchkriterien'
            });
    }


    public getSearchInputType(field: FieldDefinition|undefined): 'input'|'dropdown'|'boolean'|undefined {

        if (!field) return undefined;

        if (SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType as string)) {
            return 'input';
        } else if (SearchConstraintsComponent.dropdownInputTypes.includes(field.inputType as string)) {
            return 'dropdown';
        } else if (field.inputType === 'boolean') {
            return 'boolean';
        } else {
            return undefined;
        }
    }


    public selectField(fieldName: string) {

        this.selectedField = this.fields.find(field => field.name === fieldName);
        this.searchTerm = '';
    }


    public async addConstraint() {

        if (!this.selectedField || this.searchTerm.length == 0) return;

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        const constraintName: string = this.selectedField.name
            + ':' + ConstraintIndexer.getIndexType(this.selectedField);
        constraints[constraintName] = this.searchTerm;
        await this.setCustomConstraints(constraints);

        this.reset();
    }


    public async removeConstraint(constraintName: string) {

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        delete constraints[constraintName];
        await this.setCustomConstraints(constraints);

        this.reset();
    }


    public getSearchTermLabel(constraintListItem: ConstraintListItem): string {

        if (constraintListItem.searchInputType === 'boolean') {
            return (constraintListItem.searchTerm === 'true')
                ? this.i18n({
                    id: 'boolean.yes',
                    value: 'Ja'
                })
                : this.i18n({
                    id: 'boolean.no',
                    value: 'Nein'
                });
        } else {
            return constraintListItem.searchTerm;
        }
    }


    public handleClick(event: Event) {

        if (!this.showConstraintsMenu) return;

        let target: any = event.target;

        do {
            if (target.id && target.id.startsWith('constraints-menu')) return;
            target = target.parentNode;
        } while (target);

        this.showConstraintsMenu = false;
        this.reset();
    }


    protected abstract getCustomConstraints(): { [name: string]: string };


    protected abstract async setCustomConstraints(constraints: { [name: string]: string }): Promise<void>;


    protected reset() {

        this.updateConstraintListItems();
        this.updateFields();
        this.removeUserEntries();
    }


    private updateConstraintListItems() {

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        this.constraintListItems = Object.keys(constraints)
            .map(constraintName => {
                const fieldName: string = SearchConstraintsComponent.getFieldName(constraintName);

                return {
                    name: constraintName,
                    fieldName: fieldName,
                    label: this.getLabel(constraintName),
                    searchTerm: constraints[constraintName],
                    searchInputType: this.getSearchInputType(this.getField(fieldName))
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


    private getField(fieldName: string): FieldDefinition {

        return this.projectConfiguration.getFieldDefinitions(this.type)
            .find(field => field.name === fieldName) as FieldDefinition;
    }


    private getLabel(constraintName: string): string {

        return this.projectConfiguration.getTypesMap()[this.type].fields
            .find((field: FieldDefinition) => {
                return field.name === SearchConstraintsComponent.getFieldName(constraintName);
            }).label;
    }


    private static getFieldName(constraintName: string): string {

        return constraintName.substring(0, constraintName.indexOf(':'));
    }
}