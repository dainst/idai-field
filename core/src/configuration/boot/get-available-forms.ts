import { clone, map, Map } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { addFieldsToForm } from './add-fields-to-form';
import { ConfigurationErrors } from './configuration-errors';


/**
 * 
 * @author Thomas Kleinke
 */
export function getAvailableForms(categories: Map<TransientCategoryDefinition>,
                                  libraryForms: Map<LibraryFormDefinition>,
                                  builtInFields: Map<BuiltInFieldDefinition>,
                                  commonFields: Map<BuiltInFieldDefinition>,
                                  relations: Array<Relation>): Map<TransientFormDefinition> {

    const builtInForms: Map<TransientFormDefinition> = map(getMinimalForm(categories), categories);
    const forms: Map<TransientFormDefinition> = Object.keys(libraryForms).reduce((forms, formName) => {
        if (!forms[formName]) {
            forms[formName] = makeTransientForm(
                libraryForms[formName],
                formName,
                categories[libraryForms[formName].categoryName]
            );
        }
        return forms;
    }, builtInForms);

    return map(form => addFieldsToForm(form, categories, builtInFields, commonFields, relations), forms);
}


function getMinimalForm(categories: Map<TransientCategoryDefinition>) {

    return function(category: TransientCategoryDefinition, categoryName: string): TransientFormDefinition {

        let minimalForm: TransientFormDefinition|undefined = clone(
            category.minimalForm ?? (category.parent
                ? categories[category.parent].minimalForm
                : undefined
            )
        );

        if (!minimalForm) {
            throw [[ConfigurationErrors.NO_MINIMAL_FORM_PROVIDED, category.name]]
        }

        minimalForm.description = {};
        minimalForm.name = categoryName;
        minimalForm.categoryName = categoryName;
        minimalForm.parent = category.parent;
        minimalForm.color = category.color;
    
        return minimalForm;
    }
}


function makeTransientForm(libraryForm: LibraryFormDefinition, formName: string,
                           category: TransientCategoryDefinition): TransientFormDefinition {

    const clonedForm: TransientFormDefinition = clone(libraryForm) as TransientFormDefinition;
    clonedForm.name = formName;
    clonedForm.parent = category.parent;
    clonedForm.color = category.color;

    return clonedForm;
}



