import {clone, jsonClone, keysAndValues, Map} from 'tsfun';
import {BuiltinTypeDefinition} from '../model/builtin-type-definition';
import {LibraryTypeDefinition} from '../model/library-type-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';
import {ConfigurationErrors} from './configuration-errors';
import {mergeFields} from './merge-fields';


export function mergeBuiltInWithLibraryTypes(builtInTypes: Map<BuiltinTypeDefinition>,
                                      libraryTypes: Map<LibraryTypeDefinition>): Map<TransientTypeDefinition> {

    const types: Map<TransientTypeDefinition> = clone(builtInTypes) as unknown as Map<TransientTypeDefinition>;
    keysAndValues(types).forEach(([typeName, type]) => (type as any).typeFamily = typeName);

    keysAndValues(libraryTypes).forEach(([libraryTypeName, libraryType]: any) => {

        const extendedBuiltInType = builtInTypes[libraryType.typeFamily];
        if (extendedBuiltInType) {

            const newMergedType: any = jsonClone(extendedBuiltInType);
            merge(newMergedType, libraryType);
            keysAndValues(libraryType.fields).forEach(([libraryTypeFieldName, libraryTypeField]) => {
                if (extendedBuiltInType.fields[libraryTypeFieldName] && (libraryTypeField as any)['inputType']) {
                    throw [ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, libraryTypeName, libraryTypeFieldName];
                }
            });
            mergeFields(newMergedType.fields, libraryType.fields);
            types[libraryTypeName] = newMergedType;
        } else {

            if (!libraryType.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, libraryTypeName];
            types[libraryTypeName] = libraryType;
        }
    });

    return types;
}


function merge(target: any, source: any) {

    for (let sourceFieldName of Object.keys(source)) {
        if (sourceFieldName === 'fields') continue;
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) target[sourceFieldName] = source[sourceFieldName];
    }
}