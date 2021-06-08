import { Category, ConfigurationDocument, CustomCategoryDefinition, FieldDefinition } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export const isHidden = (category: Category, customConfigurationDocument: ConfigurationDocument) =>
            (field: FieldDefinition): boolean => {

        const customCategoryDefinition: CustomCategoryDefinition
            = customConfigurationDocument.resource.categories[category.libraryId ?? category.name];

        const parentCustomCategoryDefinition = category.parentCategory
            ? customConfigurationDocument.resource
                .categories[category.parentCategory.libraryId ?? category.parentCategory.libraryId]
            : undefined;

        return (customCategoryDefinition.hidden ?? []).includes(field.name) || 
            (parentCustomCategoryDefinition?.hidden ?? []).includes(field.name);
    }
}
