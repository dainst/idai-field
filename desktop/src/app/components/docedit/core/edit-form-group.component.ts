import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map } from 'tsfun';
import { Document, Field, Labels, ProjectConfiguration, Relation, compare } from 'idai-field-core';
import { Language } from '../../../services/languages';
import { AngularUtility } from '../../../angular/angular-utility';


type StratigraphicalRelationInfo = {
    imageName: 'above'|'below'|'same'|'none',
    tooltip: string
};


@Component({
    selector: 'edit-form-group',
    templateUrl: './edit-form-group.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormGroup implements OnChanges {

    @Input() fieldDefinitions: Array<Field>;
    @Input() identifierPrefix: string|undefined;
    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() languages: Map<Language>;
    @Input() scrollTargetField: string;

    public labels: { [name: string]: string };
    public descriptions: { [name: string]: string };


    constructor(private labelsService: Labels,
                private projectConfiguration: ProjectConfiguration,
                private elementRef: ElementRef,
                private i18n: I18n) {}


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
        if (this.scrollTargetField) this.scrollToTargetField();
    }


    public getFieldId = (field: Field) => 'edit-form-element-' + field.name.replace(':', '-');


    public shouldShow(field: Field): boolean {

        return field !== undefined && field.editable === true;
    }


    public getStratigraphicalRelationInfo(field: Field): StratigraphicalRelationInfo|undefined {
        
        if (!this.projectConfiguration.isSubcategory(this.document.resource.category, 'Feature')) return undefined;

        switch (field.name) {
            case Relation.Position.ABOVE:
            case Relation.Position.CUTS:
            case Relation.Position.ABUTS:
            case Relation.Position.FILLS:
                return {
                    imageName: 'above',
                    tooltip: this.i18n({ id: 'docedit.stratigraphicalRelationInfo.aboveBelow', value: 'Die Ressourcen werden in der Matrixdarstellung übereinander angezeigt.' })
                };
            case Relation.Position.BELOW:
            case Relation.Position.CUTBY:
            case Relation.Position.ABUTTEDBY:
            case Relation.Position.FILLEDBY:
                return {
                    imageName: 'below',
                    tooltip: this.i18n({ id: 'docedit.stratigraphicalRelationInfo.aboveBelow', value: 'Die Ressourcen werden in der Matrixdarstellung übereinander angezeigt.' })
                };
            case Relation.SAME_AS:
            case Relation.Position.BONDSWITH:
                return {
                    imageName: 'same',
                    tooltip: this.i18n({ id: 'docedit.stratigraphicalRelationInfo.above', value: 'Die Ressourcen werden in der Matrixdarstellung gleichgesetzt.' })
                };
            case Relation.Position.BORDERS:
                return {
                    imageName: 'none',
                    tooltip: this.i18n({ id: 'docedit.stratigraphicalRelationInfo.none', value: 'Es existiert keine direkte stratigraphische Beziehung zwischen den Ressourcen. Die Relation wird in der Matrixdarstellung nicht berücksichtigt.' })
                };
            default:
                return undefined;
        }
    }

    
    public isValidFieldData(field: Field): boolean {

        const fieldData: any = this.document.resource[field.name];
        const originalFieldData: any = this.originalDocument.resource[field.name];

        const isFieldDataValid: boolean = this.validateFieldData(fieldData, field.inputType);
        
        return Field.InputType.NUMBER_INPUT_TYPES.includes(field.inputType) || field.inputType === Field.InputType.URL
            ? isFieldDataValid || !compare(fieldData, originalFieldData)
            : isFieldDataValid;
    }


    private validateFieldData(fieldData: any, inputType: Field.InputType): boolean {

        return fieldData === undefined
            ? true
            : Field.InputType.isValidFieldData(fieldData, inputType);
    }


    private updateLabelsAndDescriptions() {

        this.labels = {};
        this.descriptions = {};

        this.fieldDefinitions.forEach(field => {
            const { label, description } = this.labelsService.getLabelAndDescription(field);
            this.labels[field.name] = label;
            this.descriptions[field.name] = description;
        });
    }


    private async scrollToTargetField() {

        await AngularUtility.refresh();

        const field: Field = this.fieldDefinitions.find(fieldDefinition => {
            return fieldDefinition.name === this.scrollTargetField;
        });
        const element: HTMLElement|null = document.getElementById(this.getFieldId(field));
        if (!element) return;

        await this.scrollToElement(element);
        await this.focusField(element);
    }


    private async scrollToElement(element: HTMLElement) {

        const containerElement: HTMLElement = this.elementRef.nativeElement;

        await AngularUtility.refresh();
        const scrollY: number = element.getBoundingClientRect().top - containerElement.getBoundingClientRect().top;
        containerElement.parentElement.scrollTo(0, scrollY);
    }


    private focusField(fieldElement: HTMLElement) {

        const inputElements = fieldElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
