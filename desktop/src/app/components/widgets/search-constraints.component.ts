import { Component, Input, OnChanges, Renderer2 } from '@angular/core';
import { aFilter, clone, is, on } from 'tsfun';
import { CategoryForm, ConstraintIndex, Datastore, Field, ProjectConfiguration, Valuelist,
    ValuelistUtil, Labels, IndexType } from 'idai-field-core';
import { SearchBarComponent } from './search-bar.component';


type ConstraintListItem = {
    name: string;
    fieldName: string,
    label: string;
    searchTerm: string,
    valuelist?: Valuelist,
    searchInputType?: SearchInputType
};

type SearchInputType = 'input'|'dropdown'|'boolean'|'exists';


@Component({
    template: '',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export abstract class SearchConstraintsComponent implements OnChanges {

    @Input() category: string;

    public fields: Array<Field>;
    public selectedField: Field|undefined;
    public searchTerm: string = '';
    public constraintListItems: Array<ConstraintListItem> = [];
    public showConstraintsMenu: boolean = false;
    public existIndexForTextField: boolean = false;

    private stopListeningToKeyDownEvents: Function|undefined;

    protected defaultFields: Array<Field>;

    private static textFieldInputTypes: string[] = ['input', 'simpleInput', 'multiInput', 'simpleMultiInput', 'text',
        'int', 'unsignedInt', 'float', 'unsignedFloat', 'url'];
    private static dropdownInputTypes: string[] = ['dropdown', 'dropdownRange', 'checkboxes', 'radio'];


    protected constructor(public searchBarComponent: SearchBarComponent,
                          private projectConfiguration: ProjectConfiguration,
                          private datastore: Datastore,
                          private renderer: Renderer2,
                          protected labels: Labels) {}


    public getValueLabel = (value: string, existsQuery: boolean = false): string => {

        switch (value) {
            case 'KNOWN':
                return existsQuery
                    ? $localize `:@@boolean.yes:Ja`
                    : $localize `:@@resources.searchBar.constraints.options.anyValue:- Beliebiger Wert -`;
            case 'UNKNOWN':
                return existsQuery
                    ? $localize `:@@boolean.no:Nein`
                    : $localize `:@@resources.searchBar.constraints.options.noValue:- Kein Wert -`;
            case 'true':
                return $localize `:@@boolean.yes:Ja`;
            case 'false':
                return $localize `:@@boolean.no:Nein`;
            default:
                return this.labels.getValueLabel(this.selectedField.valuelist, value);
        }
    }


    public getExistsLabel = (value: string) => this.getValueLabel(value, true);


    async ngOnChanges() {

        await this.removeInvalidConstraints();
        await this.reset();
    }


    public getValues() {
        
        return ['KNOWN', 'UNKNOWN'].concat(
            this.labels.orderKeysByLabels(this.selectedField.valuelist)
        );
    }


    public getBooleanValues() {

        return ['KNOWN', 'UNKNOWN', 'true', 'false'];
    }


    public getExistsValues() {

        return ['KNOWN', 'UNKNOWN'];
    }


    public selectValue(value: string) {

        this.searchTerm = value ?? '';
    }


    public getTooltip() {

        return this.constraintListItems.length === 0
            ? $localize `:@@resources.searchBar.constraints.tooltips.setupAdditionalSearchCriteria:Weitere Suchkriterien einstellen`
            : $localize `:@@resources.searchBar.constraints.tooltips.activeSearchCriteria:Aktive Suchkriterien`;
    }


    public getSearchInputType(field: Field|undefined): SearchInputType|undefined {

        if (!field) return undefined;

        if (field.inputType === 'default') {
            return 'exists';
        } else if (SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType as string)) {
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
        this.existIndexForTextField = false;
    }


    public async addConstraint() {

        if (!this.selectedField || this.searchTerm.length == 0) return;

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        const constraintName: string = this.selectedField.name
            + ':' + this.getIndexType(this.selectedField, this.searchTerm);
        constraints[constraintName] = this.searchTerm;
        await this.setCustomConstraints(constraints);

        await this.reset();
    }


    public async removeConstraint(constraintName: string) {

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        delete constraints[constraintName];
        await this.setCustomConstraints(constraints);

        await this.reset();
    }


    public getSearchTermLabel(constraintListItem: ConstraintListItem): string {

        if (constraintListItem.name.includes(':exist')
                && constraintListItem.searchInputType !== 'exists') {
            return this.getExistIndexSearchTermLabel(constraintListItem.searchTerm);
        } else if (constraintListItem.searchInputType === 'boolean'
                || constraintListItem.searchInputType === 'exists') {
            return this.getBooleanSearchTermLabel(constraintListItem.searchTerm);
        } else if (constraintListItem.valuelist) {
            return this.labels.getValueLabel(constraintListItem.valuelist, constraintListItem.searchTerm);
        } else {
            return constraintListItem.searchTerm;
        }
    }


    public getBooleanSearchTermLabel(searchTerm: string): string {

        return (searchTerm === 'true' || searchTerm === 'KNOWN')
            ? $localize `:@@boolean.yes:Ja`
            : $localize `:@@boolean.no:Nein`;
    }


    public getExistIndexSearchTermLabel(searchTerm: string): string {

        if (searchTerm === 'KNOWN') {
            return $localize `:@@resources.searchBar.constraints.anyValue:Beliebiger Wert`;
        } else {
            return $localize `:@@resources.searchBar.constraints.noValue:Kein Wert`;
        }
    }


    public getFieldLabel(field: Field): string {

        if (field.name.endsWith('.value')) {
            return this.getDropdownRangeLabel(field);
        } else if (field.name.endsWith('.endValue')) {
            return this.getDropdownRangeEndLabel(field);
        } else {
            return this.labels.get(field);
        }
    }


    public async handleClick(event: Event) {

        if (!this.showConstraintsMenu) return;

        let target: any = event.target;

        do {
            if (target.id && (target.id.startsWith('constraints-menu')
                     || target.localName === 'ng-dropdown-panel')) {
                return;
            }
            target = target.parentNode;
        } while (target);

        this.closeConstraintsMenu();
        await this.reset();
    }


    public setExistIndexSearchTermForTextField(searchTerm: 'KNOWN'|'UNKNOWN') {

        this.existIndexForTextField = true;
        this.searchTerm = searchTerm;
    }


    public removeExistIndexSearchTermForTextField() {

        this.existIndexForTextField = false;
        this.searchTerm = '';
    }


    public toggleConstraintsMenu() {

        this.showConstraintsMenu = !this.showConstraintsMenu;
        this.updateEventListener();
    }


    public async getValuelist(field: Field): Promise<Valuelist> {

        return ValuelistUtil.getValuelist(field, await this.datastore.get('project'), this.projectConfiguration);
    }


    protected abstract getCustomConstraints(): { [name: string]: string };


    protected abstract setCustomConstraints(constraints: { [name: string]: string }): Promise<void>;


    protected async reset() {

        this.updateConstraintListItems();
        await this.updateFields();
        this.removeUserEntries();
    }


    private async removeInvalidConstraints() {

        const customConstraints: { [name: string]: string } = clone(this.getCustomConstraints());

        const invalidConstraintsNames: string[] = (await aFilter(
            Object.keys(customConstraints), this.isInvalidConstraint.bind(this))
        );

        if (invalidConstraintsNames.length > 0) {
            invalidConstraintsNames.forEach((constraintName: string) => {
                delete customConstraints[constraintName];
            });
            await this.setCustomConstraints(customConstraints);
        }
    }


    private async isInvalidConstraint(constraintName: string): Promise<boolean> {

        const field: Field|undefined
            = this.getField(SearchConstraintsComponent.getFieldName(constraintName));
        if (!field) return true;

        return await this.isInvalidConstraintValue(constraintName, field);
    }


    private async isInvalidConstraintValue(constraintName: string, field: Field): Promise<boolean> {

        if (!field.inputType
            || SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType)
            || field.inputType === 'boolean'
            || ['KNOWN', 'UNKNOWN'].includes(this.getCustomConstraints()[constraintName])) {
            return false;
        }

        const valuelist: Valuelist = await this.getValuelist(field);
        return !Object.keys(valuelist.values).includes(this.getCustomConstraints()[constraintName]);
    }


    private closeConstraintsMenu() {

        this.showConstraintsMenu = false;
        this.updateEventListener();
    }


    private updateEventListener() {

        if (this.showConstraintsMenu && !this.stopListeningToKeyDownEvents) {
            this.stopListeningToKeyDownEvents = this.renderer.listen(
                'window', 'keydown', this.onKeyDown.bind(this)
            );
        } else if (this.stopListeningToKeyDownEvents) {
            this.stopListeningToKeyDownEvents();
            this.stopListeningToKeyDownEvents = undefined;
        }
    }


    private async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') {
            await this.addConstraint();
        } else if (event.key === 'Escape') {
            this.closeConstraintsMenu();
        }
    }


    private updateConstraintListItems() {

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        this.constraintListItems = Object.keys(constraints)
            .map(constraintName => {
                const fieldName: string = SearchConstraintsComponent.getFieldName(constraintName);
                const baseName: string = SearchConstraintsComponent.getBaseFieldName(fieldName);
                const field: Field = this.getField(baseName);

                return {
                    name: constraintName,
                    fieldName: fieldName,
                    label: this.getLabel(constraintName),
                    searchTerm: constraints[constraintName],
                    valuelist: field?.valuelist,
                    searchInputType: this.getSearchInputType(field)
                }
            });
    }


    private async updateFields() {

        const categoryFields = this.category
            ? clone(CategoryForm.getFields(this.projectConfiguration.getCategory(this.category)))
            : [];

        const fields: Array<Field> = this.defaultFields
            .concat(categoryFields)
            .filter(field => field.constraintIndexed && this.getSearchInputType(field));

        for (let field of fields) {
            if (field.valuelistFromProjectField) field.valuelist = await this.getValuelist(field);
        }

        this.fields = this.configureDropdownRangeFields(fields)
            .filter(field => {
                return !this.constraintListItems.find(item => item.fieldName === field.name);
            });
    }


    private configureDropdownRangeFields(fields: Array<Field>): Array<Field> {

        fields = clone(fields);

        fields
            .filter(field => field.inputType === 'dropdownRange')
            .forEach(field => {
                this.addDropdownRangeEndField(fields, field);
                field.name = field.name += '.value';
            });

        return fields;
    }


    private getDropdownRangeLabel(field: Field): string {

        const fieldLabel: string = this.labels.get(field);

        return fieldLabel + ' / ' + fieldLabel
            + $localize `:@@searchConstraints.dropdownRange.from: (von)`;
    }


    private getDropdownRangeEndLabel(field: Field): string {

        return this.labels.get(field)
            + $localize `:@@searchConstraints.dropdownRange.to: (bis)`;
    }


    private addDropdownRangeEndField(fields: Array<Field>, dropdownRangeField: Field) {

        fields.splice(fields.indexOf(dropdownRangeField) + 1, 0, {
            name: dropdownRangeField.name + '.endValue',
            label: dropdownRangeField.label,
            inputType: 'dropdownRange',
            valuelist: dropdownRangeField.valuelist,
            constraintIndexed: true
        });
    }


    private removeUserEntries() {

        this.selectedField = undefined;
        this.searchTerm = '';
    }


    private isExistIndexSearch(searchTerm: string, searchInputType: string|undefined) {

        return (searchTerm === 'KNOWN' || searchTerm === 'UNKNOWN')
            && (searchInputType !== 'input' || this.existIndexForTextField);
    }


    private getField(fieldName: string): Field|undefined {

        const defaultField: Field|undefined = this.getDefaultField(fieldName);
        if (defaultField) return defaultField;

        const category = this.projectConfiguration.getCategory(this.category);
        if (!category) return undefined;

        return CategoryForm.getFields(category)
            .find(field => field.name === fieldName) as Field;
    }


    private getLabel(constraintName: string): string {

        const fieldName: string = SearchConstraintsComponent.getFieldName(constraintName);
        const baseFieldName: string = SearchConstraintsComponent.getBaseFieldName(fieldName);

        const defaultField: Field|undefined = this.getDefaultField(fieldName);
        if (defaultField) return this.getFieldLabel(defaultField);

        const field = clone(CategoryForm.getFields(this.projectConfiguration.getCategory(this.category))
            .find(on(Field.NAME, is(baseFieldName))));

        if (!field) throw 'Illegal state: Field "' + fieldName + '" does not exist!';

        field.name = fieldName;

        return this.getFieldLabel(field);
    }


    private getIndexType(field: Field, searchTerm: string): IndexType {

        return field.name === 'isChildOf'
            ? 'contained'
            : this.isExistIndexSearch(searchTerm, this.getSearchInputType(field))
                ? 'exist'
                : ConstraintIndex.getIndexType(field);
    }


    private getDefaultField(fieldName: string): Field|undefined {

        return this.defaultFields.find(field => field.name === fieldName);
    }


    private static getFieldName(constraintName: string): string {

        return constraintName.substring(0, constraintName.lastIndexOf(':'));
    }

    
    private static getBaseFieldName(fieldName: string): string {

        return fieldName.includes('.')
            ? fieldName.substring(0, fieldName.indexOf('.'))
            : fieldName;
    }
}
