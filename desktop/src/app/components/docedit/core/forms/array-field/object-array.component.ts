import { Component, Input, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { is, remove, clone, Map } from 'tsfun';
import { Literature, Field, Dating, I18N, Labels, Dimension, ValuelistUtil, Valuelist, Datastore,
    ProjectConfiguration } from 'idai-field-core';
import { UtilTranslations } from '../../../../../util/util-translations';
import { LiteratureEntryModalComponent } from './literature-entry-modal.component';
import { MenuContext } from '../../../../../services/menu-context';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { Menus } from '../../../../../services/menus';
import { DimensionEntryModalComponent } from './dimension-entry-modal.component';
import { Language } from '../../../../../services/languages';
import { DatingEntryModalComponent } from './dating-entry-modal.component';


@Component({
    selector: 'form-field-object-array',
    templateUrl: './object-array.html'
})
/**
 * @author Thomas Kleinke
 */
export class ObjectArrayComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;
    @Input() inputType: Field.InputType;
    @Input() languages: Map<Language>;

    public valuelist?: Valuelist;


    constructor(private utilTranslations: UtilTranslations,
                private modalService: NgbModal,
                private labels: Labels,
                private decimalPipe: DecimalPipe,
                private menus: Menus,
                private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore) {}


    async ngOnChanges() {
        
        this.valuelist = await this.getValuelist();
    }
    
    
    public getLabel(entry: any) {
        
        switch (this.inputType) {
            case Field.InputType.DATING:
                return this.getDatingLabel(entry);
            case Field.InputType.DIMENSION:
                return this.getDimensionLabel(entry);
            case Field.InputType.LITERATURE:
                return this.getLiteratureLabel(entry);
        }
    }


    public async createEntry() {

        await this.edit(undefined, true);
    }


    public async edit(entry?: any, isNew: boolean = false) {

        this.menus.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = await this.openEditorModal(entry, isNew);

        try {
            const editedEntry: any = await modalReference.result;

            if (isNew) {
                this.addEntry(editedEntry);
            } else {
                this.updateEntry(entry, editedEntry);
            }
        } catch (_) {
            // Modal has been canceled
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(MenuContext.DOCEDIT);
        }
    }


    public remove(entry: any) {

        this.fieldContainer[this.field.name] = remove(is(entry))(this.fieldContainer[this.field.name]);
        if (!this.fieldContainer[this.field.name].length) delete this.fieldContainer[this.field.name];
    }


    private async openEditorModal(entry: any, isNew: boolean = false): Promise<NgbModalRef> {

        const modalClass: string = this.getModalClass();

        const options: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            animation: false,
            windowClass: 'array-field-entry-modal'
        };

        const modalReference: NgbModalRef = this.modalService.open(
            modalClass,
            options
        );

        modalReference.componentInstance.entry = clone(entry);
        modalReference.componentInstance.isNew = isNew;

        if (this.inputType !== Field.InputType.LITERATURE) {
            modalReference.componentInstance.languages = this.languages;
        }

        if (this.inputType === Field.InputType.DIMENSION) {
            modalReference.componentInstance.valuelist = this.valuelist;
        }

        await modalReference.componentInstance.initialize();
        
        return modalReference;
    }


    private addEntry(entry: any) {

        if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = [];
        this.fieldContainer[this.field.name].push(entry);
    }


    private updateEntry(originalEntry: any, editedEntry: any) {

        const index: number = this.fieldContainer[this.field.name].indexOf(originalEntry);
        this.fieldContainer[this.field.name].splice(index, 1, editedEntry);
    }


    private getDatingLabel(dating: Dating): string {

        if (dating.label) return dating.label;

        return Dating.generateLabel(
            dating,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: I18N.String|string) => this.labels.getFromI18NString(value)
        );
    }


    private getDimensionLabel(dimension: Dimension): string {

        if (dimension.label) return dimension.label;

        return Dimension.generateLabel(
            dimension,
            (value: any) => this.decimalPipe.transform(value),
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: I18N.String|string) => this.labels.getFromI18NString(value),
            this.labels.getValueLabel(this.field['valuelist'], dimension.measurementPosition)
        );
    }


    private getLiteratureLabel(literature: Literature): string {

        return Literature.generateLabel(literature, (key: string) => this.utilTranslations.getTranslation(key));
    }


    private getModalClass(): any {

        switch (this.inputType) {
            case Field.InputType.DATING:
                return DatingEntryModalComponent;
            case Field.InputType.DIMENSION:
                return DimensionEntryModalComponent;
            case Field.InputType.LITERATURE:
                return LiteratureEntryModalComponent;
        }
    }


    private async getValuelist(): Promise<Valuelist> {

        return ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.projectConfiguration
        );
    }
}
