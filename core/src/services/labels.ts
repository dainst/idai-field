import { Category } from '../model/category';
import { ValuelistDefinition } from '../model/valuelist-definition';
import { SortUtil, ValuelistUtil } from '../tools';
import { I18N } from '../tools/i18n';


export type Label = string; // move to I18N.Labeled

/**
 * @author Daniel de Oliveira
 */
export class Labels {

    constructor(private languages: { get(): string[] }) {}


    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, this.languages.get());
    }

    
    public getValueLabel(valuelist: ValuelistDefinition, valueId: string): string {

        const label = ValuelistUtil.getValueLabel(valuelist, valueId);

        const translation: string|undefined = I18N.getTranslation(label, this.languages.get());
        return translation ?? valueId;
    }


    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, this.languages.get());
    }


    public getFieldDefinitionLabel(category: Category, fieldName: string): Label {

        const label = Category.getFieldLabelValue(category, fieldName);
        if (!label) return undefined;
        return I18N.getLabel(label, this.languages.get());
    }


    public getOrderedValues(valuelist: ValuelistDefinition): string[] {

        return Object.keys(valuelist.values).sort(
            valuelist.order
                ? this.sortByCustomOrder(valuelist.order)
                : this.sortAlphanumerically(valuelist)
        );
    }


    private sortByCustomOrder = (order: string[]) => (valueA: string, valueB: string): number => {

        return order.indexOf(valueA) - order.indexOf(valueB);
    };


    private sortAlphanumerically = (valuelist: ValuelistDefinition) => (valueA: string, valueB: string): number => {

        return SortUtil.alnumCompare(
            this.getValueLabel(valuelist, valueA).toLowerCase(),
            this.getValueLabel(valuelist, valueB).toLowerCase()
        );
    };
}
