import { CategoryForm } from '../model';
import { Valuelist } from '../model';
import { SortUtil } from '../tools';
import { I18N } from '../tools/i18n';


/**
 * @author Daniel de Oliveira
 */
export class Labels {

    constructor(private getLanguages: () => string[]) {}


    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, this.getLanguages());
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


    public getFieldLabel(category: CategoryForm, fieldName: string): string {

        const label = CategoryForm.getFieldLabelValue(category, fieldName);
        if (!label) return undefined;
        return I18N.getLabel(label, this.getLanguages());
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
