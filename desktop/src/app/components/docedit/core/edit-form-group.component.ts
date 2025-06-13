import { Component, ElementRef, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { isArray, Map } from 'tsfun';
import { Condition, Document, Field, Labels, ProjectConfiguration, Relation, compare } from 'idai-field-core';
import { Language } from '../../../services/languages';
import { AngularUtility } from '../../../angular/angular-utility';
import { UtilTranslations } from '../../../util/util-translations';


type StratigraphicalRelationInfo = {
    imageName: 'above'|'below'|'same'|'none',
    tooltip: string
};


@Component({
    selector: 'edit-form-group',
    templateUrl: './edit-form-group.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormGroup implements OnChanges {

    @Input() groupFields: Array<Field>;
    @Input() categoryFields: Array<Field>;
    @Input() identifierPrefix: string|undefined;
    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() languages: Map<Language>;
    @Input() scrollTargetField: string;
    @Input() disabledRelationFields: string[];

    // Detects changes in fields of input types "dropdown", "radio", "checkboxes" and "boolean"
    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public labels: { [name: string]: string };
    public descriptions: { [name: string]: string };


    constructor(private labelsService: Labels,
                private projectConfiguration: ProjectConfiguration,
                private elementRef: ElementRef,
                private utilTranslations: UtilTranslations) {}


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
        this.autoScroll();
    }


    public getFieldId = (field: Field) => 'edit-form-element-' + field.name.replace(':', '-');

    public isDisabled = (field: Field) => this.disabledRelationFields?.includes(field.name);


    public shouldShow(field: Field): boolean {

        return field !== undefined
            && field.editable === true
            && Condition.isFulfilled(field.condition, this.document.resource, this.categoryFields, 'field');
    }


    public isConditionField(field: Field): 'single'|'multiple'|'none' {

        const conditionalFields: Array<Field> = this.categoryFields.filter(categoryField => {
            return categoryField.condition?.fieldName === field.name;
        });

        switch (conditionalFields.length) {
            case 0:
                return 'none';
            case 1:
                return 'single';
            default:
                return 'multiple';
        }
    }


    public getConditionFieldIconClass(field: Field): string {

        return this.categoryFields.find(categoryField => {
            return categoryField.condition?.fieldName === field.name
                && Condition.isFulfilled(categoryField.condition, this.document.resource, this.categoryFields, 'field');
        }) !== undefined ? 'mdi-eye-lock-open-outline' : 'mdi-eye-lock-outline';
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
                    tooltip: $localize `:@@docedit.stratigraphicalRelationInfo.aboveBelow:Die Ressourcen werden in der Matrixdarstellung übereinander angezeigt.`
                };
            case Relation.Position.BELOW:
            case Relation.Position.CUTBY:
            case Relation.Position.ABUTTEDBY:
            case Relation.Position.FILLEDBY:
                return {
                    imageName: 'below',
                    tooltip: $localize `:@@docedit.stratigraphicalRelationInfo.aboveBelow:Die Ressourcen werden in der Matrixdarstellung übereinander angezeigt.`
                };
            case Relation.SAME_AS:
            case Relation.Position.BONDSWITH:
                return {
                    imageName: 'same',
                    tooltip: $localize `:@@docedit.stratigraphicalRelationInfo.above:Die Ressourcen werden in der Matrixdarstellung gleichgesetzt.`
                };
            case Relation.Position.BORDERS:
                return {
                    imageName: 'none',
                    tooltip: $localize `:@@docedit.stratigraphicalRelationInfo.none:Es existiert keine direkte stratigraphische Beziehung zwischen den Ressourcen. Die Relation wird in der Matrixdarstellung nicht berücksichtigt.`
                };
            default:
                return undefined;
        }
    }


    public getConditionalFieldTooltip(field: Field): string {

        if (!field.condition) return '';

        const fieldLabel: string = this.labelsService.getFieldLabel(
            this.projectConfiguration.getCategory(this.document.resource.category),
            field.condition.fieldName
        );

        const conditionLabel: string =Condition.generateLabel(
            field.condition,
            key => this.utilTranslations.getTranslation(key)
        );

        if (isArray(field.condition.values) && (field.condition.values as string[]).length > 1) {
            return $localize `:@@docedit.conditionalFieldInfo.tooltip.multiple:Dieses Feld wird angezeigt, weil im Feld "${fieldLabel}" einer der folgenden Werte eingetragen ist: ${conditionLabel}`;
        } else {
            return $localize `:@@docedit.conditionalFieldInfo.tooltip.single:Dieses Feld wird angezeigt, weil im Feld "${fieldLabel}" der Wert "${conditionLabel}" eingetragen ist.`;
        }
    } 

    
    public isValidFieldData(field: Field): boolean {

        const fieldData: any = this.document.resource[field.name];
        const originalFieldData: any = this.originalDocument.resource[field.name];

        const isFieldDataValid: boolean = this.validateFieldData(fieldData, field);
        
        return Field.InputType.NUMBER_INPUT_TYPES.includes(field.inputType) || field.inputType === Field.InputType.URL
            ? isFieldDataValid || !compare(fieldData, originalFieldData)
            : isFieldDataValid;
    }


    private validateFieldData(fieldData: any, field: Field): boolean {

        return fieldData === undefined
            ? true
            : Field.isValidFieldData(fieldData, field, true);
    }


    private updateLabelsAndDescriptions() {

        this.labels = {};
        this.descriptions = {};

        this.groupFields.forEach(field => {
            const { label, description } = this.labelsService.getLabelAndDescription(field);
            this.labels[field.name] = label;
            this.descriptions[field.name] = description;
        });
    }


    private async autoScroll() {

        if (this.scrollTargetField) {
            this.scrollToTargetField();
        } else {
            this.scrollToTop();
        }
    }


    private async scrollToTargetField() {

        await AngularUtility.refresh();

        const field: Field = this.groupFields.find(fieldDefinition => {
            return fieldDefinition.name === this.scrollTargetField;
        });
        const element: HTMLElement|null = document.getElementById(this.getFieldId(field));
        if (!element) return;

        await this.scrollToElement(element);
        if (field.inputType !== Field.InputType.DATE) await this.focusField(element);

        this.scrollTargetField = undefined;
    }


    private async scrollToElement(element: HTMLElement) {

        const containerElement: HTMLElement = this.elementRef.nativeElement;

        await AngularUtility.refresh();
        const scrollY: number = element.getBoundingClientRect().top - containerElement.getBoundingClientRect().top;
        containerElement.parentElement.scrollTo(0, scrollY);
    }


    private scrollToTop() {

        const containerElement: HTMLElement = this.elementRef.nativeElement;
        containerElement.parentElement.scrollTo(0, scrollY);
    }


    private focusField(fieldElement: HTMLElement) {

        const inputElements = fieldElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
