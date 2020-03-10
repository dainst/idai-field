import {clone, forEach, includedIn, isNot, isnt, keys, keysAndValues, lookup, Map, pairWith, union} from 'tsfun';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';
import {checkFieldTypeChanges} from './check-field-type-changes';
import {mergeFields} from './merge-fields';
import {ConfigurationErrors} from './configuration-errors';


const VALUELISTS = 'valuelists';
const COMMONS = 'commons';


export function mergeTypes(customTypes: Map<CustomTypeDefinition>,
                           assertInputTypePresentIfNotCommonType: Function) {

    return (selectableTypes: Map<TransientTypeDefinition>) => {

        const mergedTypes: Map<TransientTypeDefinition> = clone(selectableTypes);

        const pairs = keysAndValues(customTypes);

        forEach(([customTypeName, customType]: any) => {

            const extendedType = mergedTypes[customTypeName];

            if (extendedType) {
                checkFieldTypeChanges(customTypeName, customType.fields, extendedType.fields);

                const newMergedType: any = clone(extendedType);
                mergePropertiesOfType(newMergedType, customType);
                mergeFields(newMergedType.fields, customType.fields);

                mergedTypes[customTypeName] = newMergedType;
            } else {
                if (!customType.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customTypeName];

                keysAndValues(customType.fields).forEach(([fieldName, field]: any) => {
                    assertInputTypePresentIfNotCommonType(customTypeName, fieldName, field);
                });

                mergedTypes[customTypeName] = customType;
            }
        })(pairs);

        return mergedTypes;
    }
}


/**
 * excluding fields
 *
 * @param target
 * @param source
 */
function mergePropertiesOfType(target: {[_: string]: any}, source: {[_: string]: any}) {

    if (source[COMMONS]) {
        target[COMMONS] = union([target[COMMONS] ? target[COMMONS] : [], source[COMMONS]]);
    }

    if (source[VALUELISTS]) {
        if (!target[VALUELISTS]) target[VALUELISTS] = {};
        keysAndValues(source[VALUELISTS]).forEach(([k, v]: any) => {
            target[VALUELISTS][k] = v;
        });
    }

    Object.keys(source)
        .filter(isnt('fields'))
        .filter(isNot(includedIn(keys(target))))
        .map(pairWith(lookup(source)))
        .forEach(overwriteIn(target));
}


function overwriteIn(target: {[_: string]: any}) {

    return ([key, value]: [string, any]) => target[key] = value;
}