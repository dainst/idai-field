import {FieldDefinition} from '../model/field-definition';
import {CategoryDefinition} from '../model/category-definition';
import {RelationDefinition} from '../model/relation-definition';
import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';
import {ConfigurationDefinition} from './configuration-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module Preprocessing {

    export function preprocess2(appConfiguration: any,
                                orderConfiguration: any) {


        addExtraFieldsOrder(appConfiguration, orderConfiguration);

        return {
            identifier: appConfiguration.identifier,
            relations: appConfiguration.relations,
            categories: getOrderedCategories(appConfiguration, orderConfiguration)
        } as ConfigurationDefinition;
    }


    export function setIsRecordedInVisibilities(configuration: UnorderedConfigurationDefinition) {

        if (!configuration.relations) return;

        configuration.relations
            .filter((relation: RelationDefinition) => relation.name === 'isRecordedIn')
            .forEach((relation: RelationDefinition) => relation.editable = false);
    }


    export function prepareSameMainCategoryResource(configuration: UnorderedConfigurationDefinition) {

        if (!configuration.relations) return;

        for (let relation of configuration.relations) {

            if (relation.name === 'isRecordedIn') { // See #8992
                relation.sameMainCategoryResource = false;
                continue;
            }

            relation.sameMainCategoryResource = !((relation as any)['sameOperation'] != undefined
                && (relation as any)['sameOperation'] === false);
        }
    }


    function addExtraFieldsOrder(appConfiguration: UnorderedConfigurationDefinition,
                                 orderConfiguration: any) {

        if (!orderConfiguration.fields) orderConfiguration.fields = {};

        Object.keys(appConfiguration.categories).forEach(categoryName => {
            if (!orderConfiguration.fields[categoryName]) orderConfiguration.fields[categoryName] = [];
            orderConfiguration.fields[categoryName]
                = [].concat(orderConfiguration.fields[categoryName]);
        });
    }


    function getOrderedCategories(appConfiguration: UnorderedConfigurationDefinition,
                                  orderConfiguration: any): Array<CategoryDefinition> {

        const categories: Array<CategoryDefinition> = [];

        if (orderConfiguration.categories) {
            orderConfiguration.categories.forEach((categoryName: string) => {
                const category: CategoryDefinition | undefined = appConfiguration.categories[categoryName];
                if (category) addToOrderedCategories(category, categoryName, categories, orderConfiguration);
            });
        }

        Object.keys(appConfiguration.categories).forEach(categoryName => {
            if (!categories.find(category => category.name === categoryName)) {
                addToOrderedCategories(
                    appConfiguration.categories[categoryName], categoryName, categories, orderConfiguration
                );
            }
        });

        return categories;
    }


    function addToOrderedCategories(category: CategoryDefinition, categoryName: string,
                                    categories: Array<CategoryDefinition>, orderConfiguration: any) {

        if (categories.includes(category)) return;

        category.name = categoryName;
        category.fields = getOrderedFields(category, orderConfiguration);
        categories.push(category);
    }


    function getOrderedFields(category: CategoryDefinition, orderConfiguration: any): Array<FieldDefinition> {

        const fields: Array<FieldDefinition> = [];

        if (!category.fields) return fields;

        if (orderConfiguration.fields[category.name]) {
            orderConfiguration.fields[category.name].forEach((fieldName: string) => {
                const field: FieldDefinition | undefined = category.fields[fieldName];
                if (field) addToOrderedFields(field, fieldName, fields);
            });
        }

        Object.keys(category.fields).forEach(fieldName => {
            if (!fields.find(field => field.name === fieldName)) {
                addToOrderedFields(category.fields[fieldName], fieldName, fields);
            }
        });

        return fields;
    }


    function addToOrderedFields(field: FieldDefinition, fieldName: string, fields: Array<FieldDefinition>) {

        if (fields.includes(field)) return;

        field.name = fieldName;
        fields.push(field);
    }
}
