import { Map } from 'tsfun';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { Relation } from '../../model/configuration/relation';
import { Field } from '../../model/configuration/field';


/**
 * @author Thomas Kleinke
 */
export function buildWorkflowRelations(forms: Map<TransientFormDefinition>): Array<Relation> {

    return buildRelations(forms, Relation.Workflow.IS_EXECUTED_ON, Relation.Workflow.IS_EXECUTION_TARGET_OF)
        .concat(buildRelations(forms, Relation.Workflow.RESULTS_IN, Relation.Workflow.IS_RESULT_OF));
}


function buildRelations(forms: Map<TransientFormDefinition>, name: string, inverse: string): Array<Relation> {

    const relations: Array<Relation> = [];
    const inverseMapping: Map<string[]> = {};

    for (let form of Object.values(forms)) {
        if (!form.range?.[name]) continue;

        relations.push({
            name,
            inverse,
            domain: [form.categoryName],
            range: form.range?.[name],
            inputType: Field.InputType.RELATION,
            editable: false,
            visible: false
        });

        form.range?.[name].forEach(categoryName => {
            if (!inverseMapping[categoryName]) inverseMapping[categoryName] = [];
            inverseMapping[categoryName].push(form.categoryName);
        });
    }

    const inverseRelations: Array<Relation> = Object.entries(inverseMapping).map(([categoryName, range]) => {
        return {
            inverse: name,
            name: inverse,
            domain: [categoryName],
            range,
            inputType: Field.InputType.RELATION,
            editable: false,
            visible: false
        };
    });

    return relations.concat(inverseRelations);
}
