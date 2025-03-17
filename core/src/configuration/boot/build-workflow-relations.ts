import { Map } from 'tsfun';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { Relation } from '../../model/configuration/relation';
import { Field } from '../../model/configuration/field';


/**
 * @author Thomas Kleinke
 */
export function buildWorkflowRelations(forms: Map<TransientFormDefinition>): Array<Relation> {

    return buildRelations(forms, Relation.Workflow.IS_WORKFLOW_STEP_OF, Relation.Workflow.HAS_WORKFLOW_STEP)
        .concat(buildRelations(forms, Relation.Workflow.PRODUCES, Relation.Workflow.IS_PRODUCED_IN));
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
            inputType: Field.InputType.RELATION
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
            inputType: Field.InputType.RELATION
        };
    });

    return relations.concat(inverseRelations);
}
