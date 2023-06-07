import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, isEmpty, nop, set, Map, clone } from 'tsfun';
import { I18N, InPlace, Labels, SortUtil, Valuelist, ValuelistValue } from 'idai-field-core';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { Modals } from '../../../../services/modals';
import { MenuContext } from '../../../../services/menu-context';
import { ValueEditorModalComponent } from './value-editor-modal.component';
import { M } from '../../../messages/m';
import { ConfigurationUtil } from '../../configuration-util';


@Component({
    templateUrl: './valuelist-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistEditorModalComponent extends ConfigurationEditorModalComponent {

    public valuelist: Valuelist;
    public extendedValuelist?: Valuelist;

    public newValueId: string = '';
    public order: string[];
    public sortAlphanumerically: boolean;
    public dragging: boolean;
    public openedFromFieldEditor: boolean;

    public inputPlaceholder: string = this.i18n({
        id: 'configuration.newValue', value: 'Neuer Wert'
    });

    protected changeMessage = this.i18n({
        id: 'configuration.valuelistChanged', value: 'Die Werteliste wurde geändert.'
    });

    protected menuContext: MenuContext = MenuContext.CONFIGURATION_VALUELIST_EDIT;


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private settingsProvider: SettingsProvider,
                private labels: Labels,
                private i18n: I18n) {

        super(activeModal, modals, menuService, messages);
    }


    public getCustomValuelistDefinition = () => this.configurationDocument.resource.valuelists?.[this.valuelist.id];

    public getClonedValuelistDefinition = () =>
        this.clonedConfigurationDocument.resource.valuelists?.[this.valuelist.id];

    public getValueIds = () => this.sortAlphanumerically ? this.getSortedValueIds() : this.order;

    public isInherited = (valueId: string) => this.extendedValuelist?.values[valueId] !== undefined;

    public isHidden = (valueId: string) => this.getClonedValuelistDefinition().hidden?.includes(valueId);


    public initialize() {

        super.initialize();

        if (this.new) {
            if (!this.clonedConfigurationDocument.resource.valuelists) {
                this.clonedConfigurationDocument.resource.valuelists = {};
            }
            this.clonedConfigurationDocument.resource.valuelists[this.valuelist.id] = {
                values: {},
                createdBy: this.settingsProvider.getSettings().username,
                creationDate: new Date().toISOString().split('T')[0]
            };

            if (this.extendedValuelist) {
                this.getClonedValuelistDefinition().extendedValuelist = this.extendedValuelist.id;
                if (this.extendedValuelist.order) {
                    this.getClonedValuelistDefinition().order = this.extendedValuelist.order;
                }
            }
        }

        if (!this.getClonedValuelistDefinition().references) this.getClonedValuelistDefinition().references = [];
        this.sortAlphanumerically = this.getClonedValuelistDefinition().order === undefined;
        this.order = this.getOrder() ?? this.getSortedValueIds();
    }


    public async confirm() {

        const clonedValuelistDefinition = this.getClonedValuelistDefinition();

        if (isEmpty(clonedValuelistDefinition.values) && !this.extendedValuelist) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUES_IN_VALUELIST]);
        }

        try {
            ConfigurationUtil.cleanUpAndValidateReferences(clonedValuelistDefinition);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        clonedValuelistDefinition.values = this.removeEmptyStringsFromValues(clonedValuelistDefinition.values);
        clonedValuelistDefinition.description = I18N.removeEmpty(this.clonedDescription);
        
        if (this.sortAlphanumerically) {
            delete clonedValuelistDefinition.order;
        } else {
            clonedValuelistDefinition.order = this.order;
        }

        await super.confirm(true);
    }


    public isChanged(): boolean {

        return this.new
            || !equal(this.getCustomValuelistDefinition().values)
                    (this.removeEmptyStringsFromValues(this.getClonedValuelistDefinition().values))
            || this.isHiddenChanged()
            || !equal(this.description)(I18N.removeEmpty(this.clonedDescription))
            || (this.sortAlphanumerically && this.getClonedValuelistDefinition().order !== undefined)
            || !this.sortAlphanumerically && (!this.getClonedValuelistDefinition().order
                || !equal(this.order, this.getClonedValuelistDefinition().order))
        || ConfigurationUtil.isReferencesArrayChanged(this.getCustomValuelistDefinition(),
                this.getClonedValuelistDefinition());
    }


    private isHiddenChanged(): boolean {

        const originalHidden: string[]|undefined = this.getCustomValuelistDefinition().hidden;
        const clonedHidden: string[]|undefined = this.getClonedValuelistDefinition().hidden;

        return originalHidden === undefined && clonedHidden !== undefined
            || originalHidden !== undefined && clonedHidden === undefined
            || !equal(this.getCustomValuelistDefinition().hidden)(this.getClonedValuelistDefinition().hidden);
    }


    public getValueLabel(valueId: string): string {
        
        return this.getClonedValuelistDefinition().values[valueId] || !this.extendedValuelist
            ? this.labels.getValueLabel(this.getClonedValuelistDefinition(), valueId)
            : this.labels.getValueLabel(this.extendedValuelist, valueId)
    }


    public async editValue(valueId: string, isNewValue: boolean = false) {

        const [result, componentInstance] = this.modals.make<ValueEditorModalComponent>(
            ValueEditorModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.value = this.getClonedValuelistDefinition().values[valueId]
            ?? this.extendedValuelist?.values[valueId]
            ?? {};

        componentInstance.valueId = valueId;
        componentInstance.new = isNewValue;
        componentInstance.projectLanguages = this.getClonedProjectLanguages();
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            editedValue => this.getClonedValuelistDefinition().values[valueId] = editedValue,
            nop
        );
    }


    public async addValue(valueId: string) {

        this.newValueId = '';
        await this.editValue(valueId, true);
        this.order.push(valueId);
    }


    public deleteValue(valueId: string) {

        delete this.getClonedValuelistDefinition().values[valueId];
        this.order = this.removeDeletedValuesFromOrder(this.order);
    }


    public isValidValue(valueId: string): boolean {

        return valueId && !Object.keys(this.getClonedValuelistDefinition().values).includes(valueId);
    }


    public toggleSort() {

        this.sortAlphanumerically = !this.sortAlphanumerically;
    }

    
    public toggleHidden(valueId: string) {

        const valuelistDefinition = this.getClonedValuelistDefinition();

        if (valuelistDefinition.hidden?.includes(valueId)) {
            valuelistDefinition.hidden.splice(valuelistDefinition.hidden.indexOf(valueId), 1);
            if (valuelistDefinition.hidden.length === 0) delete valuelistDefinition.hidden;
        } else {
            if (!valuelistDefinition.hidden) valuelistDefinition.hidden = [];
            valuelistDefinition.hidden.push(valueId);
            valuelistDefinition.hidden.sort(SortUtil.alnumCompare);
        }
    }


    public onDrop(event: CdkDragDrop<any>) {

        InPlace.moveInArray(this.order, event.previousIndex, event.currentIndex);
    }


    private getOrder(): string[]|undefined {

        const clonedValuelistDefinition: Valuelist = this.getClonedValuelistDefinition();

        if (!clonedValuelistDefinition.order) return undefined;

        return this.removeDeletedValuesFromOrder(clonedValuelistDefinition.order);
    }


    private removeDeletedValuesFromOrder(order: string[]): string[] {

        return order.filter(valuelistId => {
            return this.getClonedValuelistDefinition().values[valuelistId] !== undefined
                || this.extendedValuelist?.values[valuelistId] !== undefined;
        });
    }


    private getSortedValueIds(): string[] {

        const valueIds: string[] = set(
            Object.keys(this.getClonedValuelistDefinition().values)
                .concat(this.extendedValuelist ? Object.keys(this.extendedValuelist.values) : [])
        );

        return valueIds.sort((valueId1: string, valueId2: string) => {
            return SortUtil.alnumCompare(this.getValueLabel(valueId1), this.getValueLabel(valueId2));
        });
    }


    private removeEmptyStringsFromValues(values: Map<ValuelistValue>): Map<ValuelistValue> {

        const result: Map<ValuelistValue> = clone(values);

        Object.keys(result).forEach(key => {
            const value = result[key];

            if (value.label) {
                value.label = I18N.removeEmpty(value.label);
                if (isEmpty(value.label)) delete value.label;
            }
            if (value.description) {
                value.description = I18N.removeEmpty(value.description);
                if (isEmpty(value.description)) delete value.description;
            }

            if (this.extendedValuelist && this.extendedValuelist.values?.[key]
                    && (isEmpty(value) || equal(this.extendedValuelist.values[key] as any)(value as any))) {
                delete result[key];
            }
        });

        return result;
    }


    protected getLabel(): I18N.String {

        return undefined;
    }


    protected getDescription(): I18N.String {

        return this.valuelist.description;
    }


    protected updateCustomLanguageConfigurations() {}
}
