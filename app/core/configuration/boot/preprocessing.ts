import {empty, isNot, on, subtract} from 'tsfun';
import {FieldDefinition} from '../model/field-definition';
import {TypeDefinition} from '../model/type-definition';
import {RelationDefinition} from '../model/relation-definition';
import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';
import {ConfigurationDefinition} from './configuration-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module Preprocessing {

    export function preprocess2(appConfiguration: any,
                                searchConfiguration: any,
                                orderConfiguration: any) {

        applySearchConfiguration(appConfiguration, searchConfiguration);
        addExtraFieldsOrder(appConfiguration, orderConfiguration);

        return {
            identifier: appConfiguration.identifier,
            relations: appConfiguration.relations,
            types: getOrderedTypes(appConfiguration, orderConfiguration)
        } as ConfigurationDefinition;
    }





    export function applySearchConfiguration(configuration: UnorderedConfigurationDefinition,
                                             searchConfiguration: any) {

        Object.keys(searchConfiguration).forEach(typeName => {
            const type: TypeDefinition = configuration.types[typeName];
            if (!type) return;

            applySearchConfigurationForType(searchConfiguration, type, typeName, 'fulltext',
                'fulltextIndexed');
            applySearchConfigurationForType(searchConfiguration, type, typeName, 'constraint',
                'constraintIndexed');
        });
    }


    function applySearchConfigurationForType(searchConfiguration: any, type: TypeDefinition, typeName: string,
                                             indexType: string, indexFieldName: string) {

        const fulltextFieldNames: string[]|undefined = searchConfiguration[typeName][indexType];
        if (!fulltextFieldNames) return;

        fulltextFieldNames.forEach(fieldName => {
            const field = type.fields[fieldName];
            if (field) field[indexFieldName] = true;
        });
    }


    export function setIsRecordedInVisibilities(configuration: UnorderedConfigurationDefinition) {

        if (!configuration.relations) return;

        configuration.relations
            .filter((relation: RelationDefinition) => relation.name === 'isRecordedIn')
            .forEach((relation: RelationDefinition) => relation.editable = false);
    }


    export function prepareSameMainTypeResource(configuration: UnorderedConfigurationDefinition) {

        if (!configuration.relations) return;

        for (let relation of configuration.relations) {

            if (relation.name === 'isRecordedIn') { // See #8992
                relation.sameMainTypeResource = false;
                continue;
            }

            relation.sameMainTypeResource = !((relation as any)['sameOperation'] != undefined
                && (relation as any)['sameOperation'] === false);
        }
    }


    function addExtraFieldsOrder(appConfiguration: UnorderedConfigurationDefinition,
                                 orderConfiguration: any) {

        if (!orderConfiguration.fields) orderConfiguration.fields = {};

        Object.keys(appConfiguration.types).forEach(typeName => {
            if (!orderConfiguration.fields[typeName]) orderConfiguration.fields[typeName] = [];
            orderConfiguration.fields[typeName]
                = [].concat(orderConfiguration.fields[typeName]);
        });
    }


    function getOrderedTypes(appConfiguration: UnorderedConfigurationDefinition,
                             orderConfiguration: any): Array<TypeDefinition> {

        const types: Array<TypeDefinition> = [];

        if (orderConfiguration.types) {
            orderConfiguration.types.forEach((typeName: string) => {
                const type: TypeDefinition | undefined = appConfiguration.types[typeName];
                if (type) addToOrderedTypes(type, typeName, types, orderConfiguration);
            });
        }

        Object.keys(appConfiguration.types).forEach(typeName => {
            if (!types.find(type => type.type === typeName)) {
                addToOrderedTypes(appConfiguration.types[typeName], typeName, types, orderConfiguration);
            }
        });

        return types;
    }


    function addToOrderedTypes(type: TypeDefinition, typeName: string, types: Array<TypeDefinition>,
                               orderConfiguration: any) {

        if (types.includes(type)) return;

        type.type = typeName;
        type.fields = getOrderedFields(type, orderConfiguration);
        types.push(type);
    }


    function getOrderedFields(type: TypeDefinition, orderConfiguration: any): Array<FieldDefinition> {

        const fields: Array<FieldDefinition> = [];

        if (!type.fields) return fields;

        if (orderConfiguration.fields[type.type]) {
            orderConfiguration.fields[type.type].forEach((fieldName: string) => {
                const field: FieldDefinition | undefined = type.fields[fieldName];
                if (field) addToOrderedFields(field, fieldName, fields);
            });
        }

        Object.keys(type.fields).forEach(fieldName => {
            if (!fields.find(field => field.name === fieldName)) {
                addToOrderedFields(type.fields[fieldName], fieldName, fields);
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
