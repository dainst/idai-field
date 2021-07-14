import { Category } from '../model/category';
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


    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, this.languages.get());
    }


    public getFieldDefinitionLabel(category: Category, fieldName: string): Label {

        const label = Category.getFieldLabelValue(category, fieldName);
        if (!label) return undefined;
        return I18N.getLabel(label, this.languages.get());
    }


    // TODO remove
    public getLanguages() {

        return this.languages.get();
    }
}
