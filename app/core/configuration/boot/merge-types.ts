import {clone, reduce, includedIn, isNot, isnt, keys, keysAndValues,
    lookup, Map, pairWith, union, assoc, Pair, flow, map, filter, forEach} from 'tsfun';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';
import {checkFieldTypeChanges} from './check-field-type-changes';
import {mergeFields} from './merge-fields';
import {ConfigurationErrors} from './configuration-errors';


export function mergeTypes(customTypes: Map<CustomTypeDefinition>,
                           assertInputTypePresentIfNotCommonType: Function) {

    return (selectableTypes: Map<TransientTypeDefinition>) => {

        return reduce((mergedTypes: Map<TransientTypeDefinition>,
                       [customTypeName, customType]: Pair<string, CustomTypeDefinition>) => {

            return assoc(customTypeName,
                mergedTypes[customTypeName]
                    ? handleDirectTypeExtension(customTypeName, customType, mergedTypes[customTypeName])
                    : handleChildTypeExtension(customTypeName, customType, assertInputTypePresentIfNotCommonType))
            (mergedTypes);

        }, clone(selectableTypes))(keysAndValues(customTypes));
    }
}


function handleChildTypeExtension(customTypeName: string,
                                  customType: CustomTypeDefinition,
                                  assertInputTypePresentIfNotCommonType: Function): TransientTypeDefinition {

    if (!customType.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customTypeName];

    keysAndValues(customType.fields).forEach(([fieldName, field]: any) => {
        assertInputTypePresentIfNotCommonType(customTypeName, fieldName, field);
    });

    return customType as TransientTypeDefinition;
}


function handleDirectTypeExtension(customTypeName: string,
                                   customType: CustomTypeDefinition,
                                   extendedType: TransientTypeDefinition) {

    checkFieldTypeChanges(customTypeName, customType.fields, extendedType.fields);

    const newMergedType: any = clone(extendedType);
    mergePropertiesOfType(newMergedType, customType);
    mergeFields(newMergedType.fields, customType.fields);
    return newMergedType;
}


/**
 * excluding fields
 *
 * @param target
 * @param source
 */
function mergePropertiesOfType(target: {[_: string]: any}, source: {[_: string]: any}) {

    if (source[TransientTypeDefinition.COMMONS]) {
        target[TransientTypeDefinition.COMMONS]
            = union([
                target[TransientTypeDefinition.COMMONS]
                    ? target[TransientTypeDefinition.COMMONS]
                    : [],
            source[TransientTypeDefinition.COMMONS]]);
    }

    if (source[CustomTypeDefinition.VALUELISTS]) {
        if (!target[CustomTypeDefinition.VALUELISTS]) target[CustomTypeDefinition.VALUELISTS] = {};
        keysAndValues(source[CustomTypeDefinition.VALUELISTS]).forEach(([k, v]: any) => {
            target[CustomTypeDefinition.VALUELISTS][k] = v;
        });
    }

    return flow(
        source,
        keys,
        filter(isnt(TransientTypeDefinition.FIELDS)),
        filter(isNot(includedIn(keys(target)))),
        map(pairWith(lookup(source))),
        forEach(overwriteIn(target)));
}


function overwriteIn(target: Map) {

    return ([key, value]: [string, any]) => target[key] = value;
}