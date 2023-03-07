import { includedIn, isNot, isnt, Map, pairWith, flow, filter, clone, assoc, keysValues, map, forEach,
    lookup, to, flatten, set } from 'tsfun';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { ConfigurationErrors } from './configuration-errors';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { addFieldsToForm } from './add-fields-to-form';
import { Relation } from '../../model/configuration/relation';
import { Field } from '../../model/configuration/field';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function mergeWithCustomForms(customForms: Map<CustomFormDefinition>,
                                     categories: Map<TransientCategoryDefinition>,
                                     builtInFields: Map<Field>,
                                     commonFields: Map<Field>,
                                     relations: Array<Relation>,
                                     selectedForms: string[]) {

    return (forms: Map<TransientFormDefinition>) => {

        return getSortedCustomForms(customForms, forms, categories).reduce(
            (mergedForms: Map<TransientFormDefinition>,
            [customFormName, customForm]: [string, CustomFormDefinition]) => {

            const parentForm: CustomFormDefinition|undefined = getParentForm(
                customForm, customFormName, mergedForms, categories, selectedForms
            );

            return assoc(customFormName,
                mergedForms[customFormName]
                    ? handleDirectExtension(
                        customForm, mergedForms[customFormName], categories, builtInFields, commonFields,
                        relations, parentForm
                    )
                    : handleChildExtension(
                        customFormName, customForm, parentForm, categories, builtInFields, commonFields,
                        relations
                    )
            )
            (mergedForms);

        }, clone(forms));
    };
}


function handleDirectExtension(customForm: CustomFormDefinition,
                               extendedForm: TransientFormDefinition,
                               categories: Map<TransientCategoryDefinition>,
                               builtInFields: Map<Field>,
                               commonFields: Map<Field>,
                               relations: Array<Relation>,
                               parentForm?: CustomFormDefinition): TransientFormDefinition {

    const clonedCustomForm: TransientFormDefinition
        = inheritValuelists(customForm, parentForm, extendedForm) as TransientFormDefinition;
    
    clonedCustomForm.categoryName = extendedForm.categoryName;
    
    const result = addFieldsToForm(
        clonedCustomForm, categories, builtInFields, commonFields, relations, parentForm, extendedForm
    );

    if (parentForm) result.hidden = getMergedHiddenArray(result, parentForm);

    return mergeFormProperties(extendedForm, result);
}


function handleChildExtension(customFormName: string, 
                              customForm: CustomFormDefinition,
                              parentForm: CustomFormDefinition,
                              categories: Map<TransientCategoryDefinition>,
                              builtInFields: Map<Field>,
                              commonFields: Map<Field>,
                              relations: Array<Relation>): TransientFormDefinition {

    if (!customForm.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customFormName];

    const clonedCustomForm: TransientFormDefinition
        = inheritValuelists(customForm, parentForm) as TransientFormDefinition;
    
    clonedCustomForm.name = customFormName;
    clonedCustomForm.categoryName = customFormName;
    clonedCustomForm.hidden = getMergedHiddenArray(customForm, parentForm);
    
    clonedCustomForm.customFields = clonedCustomForm.groups ? flatten(clonedCustomForm.groups.map(to('fields'))): [];

    return addFieldsToForm(clonedCustomForm, categories, builtInFields, commonFields, relations, parentForm);
}


function mergeFormProperties(target: TransientFormDefinition,
                             source: TransientFormDefinition): TransientFormDefinition {

    if (source.valuelists) {
        if (!target.valuelists) target.valuelists = {};

        keysValues(source.valuelists).forEach(([valuelistId, valuelist]) => {
            target.valuelists[valuelistId] = valuelist;
        });
    }
    
    target.fields = source.fields;
    target.defaultColor = target.color;
    if (source.color) target.color = source.color;
    target.hidden = source.hidden;
    if (source.groups) {
        const sourceFields: string[] = flatten(source.groups.map(to('fields')));
        const targetFields: string[] = target.groups ? flatten(target.groups.map(to('fields'))) : [];
        
        target.customFields = sourceFields.filter(fieldName => !targetFields.includes(fieldName));
        target.groups = source.groups;
    } else {
        target.customFields = [];
    }

    flow(
        source,
        Object.keys,
        filter(isnt(TransientFormDefinition.FIELDS)),
        filter(isNot(includedIn(Object.keys(target)))),
        map(pairWith(lookup(source))),
        forEach(overwriteIn(target))
    );

    return target;
}


function getSortedCustomForms(customForms: Map<CustomFormDefinition>, forms: Map<TransientFormDefinition>,
                              categories: Map<TransientCategoryDefinition>): [string, CustomFormDefinition][] {

    return keysValues(customForms).sort((element1, element2) => {
        const parentCategoryName1: string|undefined = getParentCategoryName(
            element1[1], element1[0], forms, categories
        );
        const parentCategoryName2: string|undefined = getParentCategoryName(
            element2[1], element2[0], forms, categories
        );

        if (parentCategoryName1 && !parentCategoryName2) return 1;
        if (!parentCategoryName1 && parentCategoryName2) return -1;
        return 0;
    });
}


function getParentForm(customForm: CustomFormDefinition, customFormName: string,
                       forms: Map<TransientFormDefinition>, categories: Map<TransientCategoryDefinition>,
                       selectedForms: string[]): CustomFormDefinition|undefined {

    const parentCategoryName: string = getParentCategoryName(customForm, customFormName, forms, categories);

    return parentCategoryName
        && Object.values(forms).filter(form => selectedForms.includes(form.name))
            .find(form => form.categoryName === parentCategoryName);
}


function getParentCategoryName(customForm: CustomFormDefinition, customFormName: string,
                               forms: Map<TransientFormDefinition>,
                               categories: Map<TransientCategoryDefinition>): string {

    let parentCategory: string = customForm.parent;

    if (!parentCategory) {
        const category = forms[customFormName]
            ? categories[forms[customFormName].categoryName]
            : categories[customFormName];
        parentCategory = category.parent;
    }

    return parentCategory;
}


function inheritValuelists(childForm: CustomFormDefinition, parentForm?: CustomFormDefinition,
                           extendedForm?: TransientFormDefinition): CustomFormDefinition {

    const clonedChildForm = clone(childForm);
    if (!clonedChildForm.valuelists) clonedChildForm.valuelists = {};
    
    const extendedFormValuelists = extendedForm?.valuelists ?? {};
    const parentFormValuelists = parentForm?.valuelists ?? {};

    Object.keys(extendedFormValuelists).forEach(fieldName => {
        if (!clonedChildForm.valuelists[fieldName]) {
            clonedChildForm.valuelists[fieldName] = extendedFormValuelists[fieldName];
        }
    });

    Object.keys(parentFormValuelists).forEach(fieldName => {
        clonedChildForm.valuelists[fieldName] = parentFormValuelists[fieldName];
    });

    return clonedChildForm;
}


function getMergedHiddenArray(childForm: CustomFormDefinition, parentForm: CustomFormDefinition): string[] {

    return set((parentForm.hidden ?? []).concat(childForm.hidden ?? []));
}


function overwriteIn(target: Map<any>) {

    return ([key, value]: [string, any]) => target[key] = value;
}
