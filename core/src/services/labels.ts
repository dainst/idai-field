import { isString } from 'tsfun';
import { I18N } from '../tools/i18n';
import { Valuelist } from '../model/configuration/valuelist';
import { CategoryForm } from '../model/configuration/category-form';
import { SortUtil } from '../tools/sort-util';
import { Relation } from '../model/configuration/relation';
import { Field } from '../model/configuration/field';


/**
 * @author Daniel de Oliveira
 */
export class Labels {

    constructor(private getLanguages: () => string[]) {}


    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, this.getLanguages());
    }


    public getFromI18NString(i18nString: I18N.String|string): string {

        if (isString(i18nString)) return i18nString;
        if (!I18N.isI18NString(i18nString)) return undefined;

        const fallbackValue: string|undefined = i18nString && Object.keys(i18nString).length > 0
            ? i18nString[I18N.UNSPECIFIED_LANGUAGE] ?? i18nString[Object.keys(i18nString)[0]]
            : undefined;

        return this.get({ label: i18nString, name: fallbackValue });
    }

    
    public getValueLabel(valuelist: Valuelist, valueId: string): string {

        const label = Valuelist.getValueLabel(valuelist, valueId);

        const translation: string|undefined = I18N.getTranslation(label, this.getLanguages());
        return translation ?? valueId;
    }


    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, this.getLanguages());
    }


    public getDescription(describedValue: I18N.Described): string {

        return I18N.getDescription(describedValue, this.getLanguages());
    }


    public getFieldLabel(category: CategoryForm, fieldName: string): string {

        const field: Field = CategoryForm.getField(category, fieldName);
        if (!field) return undefined;
        return I18N.getLabel(field, this.getLanguages());
    }


    public getRelationLabel(relation: Relation|string, relations?: Array<Relation>): string {

        if (typeof(relation) === 'string') {
            relation = relations.find(entry => entry.name === relation);
        }
        if (!relation) return undefined;

        return I18N.getLabel(relation, this.getLanguages());
    }


    public orderKeysByLabels(valuelist: Valuelist): string[] {

        return Valuelist.orderKeysByLabels(valuelist, this.sortAlphanumerically);
    }


    private sortAlphanumerically = (valuelist: Valuelist) => (valueA: string, valueB: string): number => {

        return SortUtil.alnumCompare(
            this.getValueLabel(valuelist, valueA).toLowerCase(),
            this.getValueLabel(valuelist, valueB).toLowerCase()
        );
    };
}
