import {Input, OnChanges, Renderer2, SimpleChanges} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {to} from 'tsfun';
import {ConstraintIndex} from '../core/datastore/index/constraint-index';
import {SearchBarComponent} from './search-bar.component';
import {FieldDefinition} from '../core/configuration/model/field-definition';
import {ProjectConfiguration} from '../core/configuration/project-configuration';
import {SettingsService} from '../core/settings/settings-service';
import {ValuelistUtil} from '../core/util/valuelist-util';
import {IdaiType} from '../core/configuration/model/idai-type';
import {clone} from '../core/util/object-util';


type ConstraintListItem = {
    name: string;
    fieldName: string,
    label: string;
    searchTerm: string,
    searchInputType?: string
};

type SearchInputType = 'input'|'dropdown'|'boolean'|'exists';


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
    public existIndexForTextField: boolean = false;

    private stopListeningToKeyDownEvents: Function|undefined;

    protected defaultFields: Array<FieldDefinition>;

    private static textFieldInputTypes: string[] = ['input', 'text', 'unsignedInt', 'float', 'unsignedFloat'];
    private static dropdownInputTypes: string[] = ['dropdown', 'checkboxes', 'radio'];


    protected constructor(public searchBarComponent: SearchBarComponent,
                          private projectConfiguration: ProjectConfiguration,
                          private settingsService: SettingsService,
                          private renderer: Renderer2,
                          protected i18n: I18n) {}


    async ngOnChanges(changes: SimpleChanges) {

        await this.removeInvalidConstraints();
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


    public getSearchInputType(field: FieldDefinition|undefined): SearchInputType|undefined {

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

        this.reset();
    }


    public async removeConstraint(constraintName: string) {

        const constraints: { [name: string]: string } = this.getCustomConstraints();
        delete constraints[constraintName];
        await this.setCustomConstraints(constraints);

        this.reset();
    }


    public getSearchTermLabel(constraintListItem: ConstraintListItem): string {

        if (constraintListItem.name.includes(':exist')
                && constraintListItem.searchInputType !== 'exists') {
            return this.getExistIndexSearchTermLabel(constraintListItem.searchTerm);
        } else if (constraintListItem.searchInputType === 'boolean'
                || constraintListItem.searchInputType === 'exists') {
            return this.getBooleanSearchTermLabel(constraintListItem.searchTerm);
        } else {
            return constraintListItem.searchTerm;
        }
    }


    public getBooleanSearchTermLabel(searchTerm: string): string {

        return (searchTerm === 'true' || searchTerm === 'KNOWN')
            ? this.i18n({
                id: 'boolean.yes',
                value: 'Ja'
            })
            : this.i18n({
                id: 'boolean.no',
                value: 'Nein'
            });
    }


    public handleClick(event: Event) {

        if (!this.showConstraintsMenu) return;

        let target: any = event.target;

        do {
            if (target.id && target.id.startsWith('constraints-menu')) return;
            target = target.parentNode;
        } while (target);

        this.closeConstraintsMenu();
        this.reset();
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


    public getValuelist(field: FieldDefinition): string[] {

        return ValuelistUtil.getValuelist(field, this.settingsService.getProjectDocument());
    }


    protected abstract getCustomConstraints(): { [name: string]: string };


    protected abstract async setCustomConstraints(constraints: { [name: string]: string }): Promise<void>;


    protected reset() {

        this.updateConstraintListItems();
        this.updateFields();
        this.removeUserEntries();
    }


    private async removeInvalidConstraints() {

        const customConstraints: { [name: string]: string } = clone(this.getCustomConstraints());
        const type: IdaiType = this.projectConfiguration.getTypesMap()[this.type];

        Object.keys(customConstraints)
            .filter(constraintName => {
                const fieldName: string = SearchConstraintsComponent.getFieldName(constraintName);
                if (this.defaultFields.map(to('name')).includes(fieldName)) return false;

                const field: FieldDefinition|undefined = type.fields.find(field => {
                    return field.name === SearchConstraintsComponent.getFieldName(constraintName);
                });
                if (!field) return true;
                if (!field.inputType
                        || SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType)
                        || ['KNOWN', 'UNKNOWN'].includes(customConstraints[constraintName])) {
                    return false;
                }
                const valuelist: string[] = this.getValuelist(field);
                return (!valuelist.includes(customConstraints[constraintName]));
            }).forEach(constraintName => {
                delete customConstraints[constraintName];
            });

        await this.setCustomConstraints(customConstraints);
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

        this.fields = this.defaultFields.concat(this.projectConfiguration.getFieldDefinitions(this.type))
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


    private isExistIndexSearch(searchTerm: string, searchInputType: string|undefined) {

        return (searchTerm === 'KNOWN' || searchTerm === 'UNKNOWN')
            && (searchInputType !== 'input' || this.existIndexForTextField);
    }


    private getExistIndexSearchTermLabel(searchTerm: string): string {

        if (searchTerm === 'KNOWN') {
            return this.i18n({
                id: 'resources.searchBar.constraints.anyValue',
                value: 'Beliebiger Wert'
            });
        } else {
            return this.i18n({
                id: 'resources.searchBar.constraints.noValue',
                value: 'Kein Wert'
            });
        }
    }


    private getField(fieldName: string): FieldDefinition {

        const defaultField: FieldDefinition|undefined = this.getDefaultField(fieldName);
        if (defaultField) return defaultField;

        return this.projectConfiguration.getFieldDefinitions(this.type)
            .find(field => field.name === fieldName) as FieldDefinition;
    }


    private getLabel(constraintName: string): string {

        const fieldName: string = SearchConstraintsComponent.getFieldName(constraintName);

        const defaultField: FieldDefinition|undefined = this.getDefaultField(fieldName);
        if (defaultField) return defaultField.label as string;

        return this.projectConfiguration.getTypesMap()[this.type].fields
            .find((field: FieldDefinition) => {
                return field.name === fieldName
            }).label;
    }


    private getIndexType(field: FieldDefinition, searchTerm: string) {

        return this.isExistIndexSearch(searchTerm, this.getSearchInputType(field))
            ? 'exist'
            : ConstraintIndex.getIndexType(field);
    }


    private getDefaultField(fieldName: string): FieldDefinition|undefined {

        return this.defaultFields.find(field => field.name === fieldName);
    }


    private static getFieldName(constraintName: string): string {

        return constraintName.substring(0, constraintName.indexOf(':'));
    }
}