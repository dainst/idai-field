import { CustomCategoryDefinition, FieldDefinition } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export const isHidden = (customCategoryDefinition: CustomCategoryDefinition,
                             parentCustomCategoryDefinition: CustomCategoryDefinition) =>
            (field: FieldDefinition): boolean => {

        return (customCategoryDefinition.hidden ?? []).includes(field.name) || 
            (parentCustomCategoryDefinition?.hidden ?? []).includes(field.name);
    }
}
