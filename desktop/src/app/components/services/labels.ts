import { Injectable } from '@angular/core';
import { Category, I18N, ProjectConfiguration } from 'idai-field-core';

const CONFIGURED_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class Labels {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, CONFIGURED_LANGUAGES);
    }


    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, CONFIGURED_LANGUAGES);
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

        return Category.getLabel(fieldName, fieldDefinitions, CONFIGURED_LANGUAGES);
    }


    public getRelationDefinitionLabel(relationName: string): string {

        return Category.getLabel(relationName, this.projectConfiguration.getAllRelationDefinitions(), CONFIGURED_LANGUAGES);
    }


    public getLanguages() {

        return CONFIGURED_LANGUAGES;
    }
}
