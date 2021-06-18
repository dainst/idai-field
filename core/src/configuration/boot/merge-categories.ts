import {includedIn, isNot, isnt, Map, pairWith, union,
    flow, filter, clone, assoc, keysValues, map, forEach, lookup} from 'tsfun';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';
import {checkFieldCategoryChanges} from './check-field-category-changes';
import {mergeFields} from './merge-fields';
import {ConfigurationErrors} from './configuration-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function mergeCategories(customCategories: Map<CustomCategoryDefinition>,
                                assertInputTypePresentIfNotCommonField: Function) {

    return (selectableCategories: Map<TransientCategoryDefinition>) => {

        return keysValues(customCategories).reduce(
            (mergedCategories: Map<TransientCategoryDefinition>,
             [customCategoryName, customCategory]: [string, CustomCategoryDefinition]) => {

            return assoc(customCategoryName,
                mergedCategories[customCategoryName]
                    ? handleDirectCategoryExtension(customCategoryName, customCategory, mergedCategories[customCategoryName])
                    : handleChildCategoryExtension(customCategoryName, customCategory, assertInputTypePresentIfNotCommonField))
            (mergedCategories);

        }, clone(selectableCategories));
    };
}


function handleChildCategoryExtension(customCategoryName: string, customCategory: CustomCategoryDefinition,
                                      assertInputTypePresentIfNotCommonField: Function): TransientCategoryDefinition {

    if (!customCategory.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customCategoryName];

    keysValues(customCategory.fields).forEach(([fieldName, field]) => {
        assertInputTypePresentIfNotCommonField(customCategoryName, fieldName, field);
    });

    return customCategory as TransientCategoryDefinition;
}


function handleDirectCategoryExtension(customCategoryName: string, customCategory: CustomCategoryDefinition,
                                       extendedCategory: TransientCategoryDefinition) {

    checkFieldCategoryChanges(customCategoryName, customCategory.fields, extendedCategory.fields);

    const newMergedCategory: any = clone(extendedCategory);
    mergePropertiesOfCategory(newMergedCategory, customCategory);
    mergeFields(newMergedCategory.fields, customCategory.fields);
    return newMergedCategory;
}


/**
 * excluding fields
 */
function mergePropertiesOfCategory(target: { [_: string]: any }, source: { [_: string]: any }) {

    if (source[TransientCategoryDefinition.COMMONS]) {
        target[TransientCategoryDefinition.COMMONS]
            = union([
                target[TransientCategoryDefinition.COMMONS]
                    ? target[TransientCategoryDefinition.COMMONS]
                    : [],
            source[TransientCategoryDefinition.COMMONS]]);
    }

    if (source[CustomCategoryDefinition.VALUELISTS]) {
        if (!target[CustomCategoryDefinition.VALUELISTS]) target[CustomCategoryDefinition.VALUELISTS] = {};

        keysValues(source[CustomCategoryDefinition.VALUELISTS])
        .forEach(([k, v]) => {
            target[CustomCategoryDefinition.VALUELISTS][k] = v;
        });
    }

    if (source.color) target.color = source.color;

    return flow(
        source,
        Object.keys,
        filter(isnt(TransientCategoryDefinition.FIELDS)),
        filter(isNot(includedIn(Object.keys(target)))),
        map(pairWith(lookup(source))),
        forEach(overwriteIn(target)));
}


function overwriteIn(target: Map<any>) {

    return ([key, value]: [string, any]) => target[key] = value;
}
