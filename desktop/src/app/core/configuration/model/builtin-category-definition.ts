import {Map} from 'tsfun';
import {BaseFieldDefinition, BaseCategoryDefinition} from './base-category-definition';


/**
 * CategoryDefinition, as used in AppConfigurator
 *
 * @author Daniel de Oliveira
 */
export interface BuiltinCategoryDefinition extends BaseCategoryDefinition {

    parent?: string;
    abstract?: boolean;
    commons?: string[];
    supercategory?: boolean,
    userDefinedSubcategoriesAllowed?: boolean,

    /**
     * If set to true, a resource of this category can only be created inside another
     * resource which is of a category related to this resource's category via includes/liesWithin.
     */
    mustLieWithin?: true,

    fields: Map<BuiltinFieldDefinition>;
}

export interface BuiltinFieldDefinition extends BaseFieldDefinition {

    group?: string;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
}