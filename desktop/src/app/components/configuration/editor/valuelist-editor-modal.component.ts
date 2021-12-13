import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, nop } from 'tsfun';
import { I18N, InPlace, Labels, SortUtil, Valuelist } from 'idai-field-core';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Modals } from '../../../services/modals';
import { MenuContext } from '../../../services/menu-context';
import { ValueEditorModalComponent } from './value-editor-modal.component';


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

    public newValueId: string = '';
    public order: string[];
    public sortAlphanumerically: boolean;
    public dragging: boolean;

    public inputPlaceholder: string = this.i18n({
        id: 'configuration.newValue', value: 'Neuer Wert'
    });

    protected changeMessage = this.i18n({
        id: 'configuration.valuelistChanged', value: 'Die Werteliste wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modalService: NgbModal,
                menuService: Menus,
                messages: Messages,
                private settingsProvider: SettingsProvider,
                private labels: Labels,
                private modals: Modals,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }


    public getCustomValuelistDefinition = () => this.configurationDocument.resource.valuelists?.[this.valuelist.id];

    public getClonedValuelistDefinition = () =>
        this.clonedConfigurationDocument.resource.valuelists?.[this.valuelist.id];

    public getValueLabel = (valueId: string) =>
        this.labels.getValueLabel(this.getClonedValuelistDefinition(), valueId);

    public getValueIds = () => this.sortAlphanumerically ? this.getSortedValueIds() : this.order;


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
            }
        }

        this.sortAlphanumerically = this.getClonedValuelistDefinition().order === undefined;
        this.order = this.getClonedValuelistDefinition().order ?? this.getSortedValueIds();
    }


    public async save() {

        this.getClonedValuelistDefinition().description = this.clonedDescription;
        
        if (this.sortAlphanumerically) {
            delete this.getClonedValuelistDefinition().order;
        } else {
            this.getClonedValuelistDefinition().order = this.order;
        }

        await super.save();
    }


    public isChanged(): boolean {
        
        return this.new
            || !equal(this.getCustomValuelistDefinition())(this.getClonedValuelistDefinition())
            || !equal(this.description)(this.clonedDescription)
            || (this.sortAlphanumerically && this.getClonedValuelistDefinition().order !== undefined)
            || !this.sortAlphanumerically && (!this.getClonedValuelistDefinition().order
                || !equal(this.order, this.getClonedValuelistDefinition().order))
    }


    public async editValue(valueId: string, isNewValue: boolean = false) {

        const [result, componentInstance] = this.modals.make<ValueEditorModalComponent>(
            ValueEditorModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.value = this.getClonedValuelistDefinition().values[valueId] ?? {};
        componentInstance.valueId = valueId;
        componentInstance.new = isNewValue;
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
    }


    public isValidValue(valueId: string): boolean {

        return valueId && !Object.keys(this.getClonedValuelistDefinition().values).includes(valueId);
    }


    public toggleSort() {

        this.sortAlphanumerically = !this.sortAlphanumerically;
    }


    public onDrop(event: CdkDragDrop<any>) {

        InPlace.moveInArray(this.order, event.previousIndex, event.currentIndex);
    }


    private getSortedValueIds(): string[] {

        return Object.keys(this.getClonedValuelistDefinition().values).sort((valueId1: string, valueId2: string) => {
            return SortUtil.alnumCompare(this.getValueLabel(valueId1),this.getValueLabel(valueId2));
        });
    }


    protected getLabel(): I18N.String {

        return undefined;
    }


    protected getDescription(): I18N.String {

        return this.valuelist.description;
    }


    protected updateCustomLanguageConfigurations() {}
}
