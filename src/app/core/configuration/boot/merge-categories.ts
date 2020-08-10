import {includedIn, isNot, isnt, Map, pairWith, union,
    Pair, flow, filter} from 'tsfun';
import {lookup, update, map, reduce, forEach} from 'tsfun/associative';
import {clone} from 'tsfun/struct';
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

        return reduce(customCategories, (mergedCategories: Map<TransientCategoryDefinition>,
                       customCategory: CustomCategoryDefinition, customCategoryName: string) => {

            return update(customCategoryName,
                mergedCategories[customCategoryName]
                    ? handleDirectCategoryExtension(customCategoryName, customCategory, mergedCategories[customCategoryName])
                    : handleChildCategoryExtension(customCategoryName, customCategory, assertInputTypePresentIfNotCommonField))
            (mergedCategories);

        }, clone(selectableCategories));
    }
}


function handleChildCategoryExtension(customCategoryName: string, customCategory: CustomCategoryDefinition,
                                      assertInputTypePresentIfNotCommonField: Function): TransientCategoryDefinition {

    if (!customCategory.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customCategoryName];

    forEach(customCategory.fields, (field, fieldName) => {
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
        forEach(source[CustomCategoryDefinition.VALUELISTS], (v: any, k: any) => {
            target[CustomCategoryDefinition.VALUELISTS][k] = v;
        });
    }

    return flow(
        source,
        Object.keys,
        filter(isnt(TransientCategoryDefinition.FIELDS)),
        filter(isNot(includedIn(Object.keys(target)))),
        map(pairWith(lookup(source))),
        forEach(overwriteIn(target)));
}


function overwriteIn(target: Map) {

    return ([key, value]: [string, any]) => target[key] = value;
}
