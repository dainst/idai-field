import { Map } from 'tsfun';
import { BaseCategoryDefinition } from './base-category-definition';
import { BuiltInFieldDefinition } from '../field/built-in-field-definition';
import { BuiltInFormDefinition } from '../form/built-in-form-definition';


export interface BuiltInCategoryDefinition extends BaseCategoryDefinition {

    fields: Map<BuiltInFieldDefinition>;
    minimalForm: BuiltInFormDefinition;
    abstract?: boolean;
    supercategory?: boolean;
    userDefinedSubcategoriesAllowed?: boolean;
    scanCodesAllowed?: boolean;
    required?: boolean;

    /**
     * If set to true, a resource of this category can only be created inside another
     * resource which is of a category related to this resource's category via includes/liesWithin.
     */
    mustLieWithin?: true;
}
