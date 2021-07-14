import { Languages } from './languages';
import { Category, I18N, ProjectConfiguration } from 'idai-field-core';


/**
 * @author Daniel de Oliveira
 */
export class Labels {

    constructor(private projectConfiguration: ProjectConfiguration,
                private languages: Languages) {}


    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, this.languages.get());
    }


    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, this.languages.get());
    }


    /**
     * Gets the label for the field if it is defined.
     * Otherwise it returns the fields definitions name.
     *
     * @param categoryName
     * @param fieldName
     * @param languages
     * @returns {string}
     * @throws {string} with an error description in case the category is not defined.
     */
    public getFieldDefinitionLabel(categoryName: string, fieldName: string): string {

        const fieldDefinitions = this.projectConfiguration.getFieldDefinitions(categoryName);
        if (fieldDefinitions.length === 0) {
            throw 'No category definition found for category \'' + categoryName + '\'';
        }

        return Category.getLabel(fieldName, fieldDefinitions, this.languages.get());
    }


    public getRelationDefinitionLabel(relationName: string): string {

        return Category.getLabel(relationName, this.projectConfiguration.getAllRelationDefinitions(), this.languages.get());
    }


    // TODO remove
    public getLanguages() {

        return this.languages.get();
    }
}
