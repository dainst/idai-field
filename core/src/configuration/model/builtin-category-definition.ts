import { Map } from 'tsfun';
import { BaseFieldDefinition, BaseCategoryDefinition, BaseGroupDefinition } from './base-category-definition';


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
    groups: Array<BaseGroupDefinition>;

    /**
     * If set to true, a resource of this category can only be created inside another
     * resource which is of a category related to this resource's category via includes/liesWithin.
     */
    mustLieWithin?: true,

    fields: Map<BuiltinFieldDefinition>;
}

export interface BuiltinFieldDefinition extends BaseFieldDefinition {

    visible?: boolean;
    editable?: boolean;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
}