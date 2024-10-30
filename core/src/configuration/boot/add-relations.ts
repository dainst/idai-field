import { isEmpty, not, on, subtract, Map } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { Named } from '../../tools/named';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { Field } from '../../model/configuration/field';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function addRelations(builtInRelations: Array<Relation>) {

    return (configuration: [Map<TransientFormDefinition>, Array<Relation>]) => {

        let [forms, relations] = configuration;
        if (!relations) return;

        const relationsToAdd = builtInRelations.concat(getCustomRelations(forms));

        for (let relationToAdd of relationsToAdd) {
            addSubcategories(forms, relationToAdd, Relation.DOMAIN);

            relations.filter(on(Named.NAME)(relationToAdd))
                .forEach((relation: any) => {
                    relation.domain = subtract(relationToAdd.domain)(relation.domain)
                });
            relations = relations.filter(not(on(Relation.DOMAIN, isEmpty)));

            relations.splice(0, 0, relationToAdd);

            addSubcategories(forms, relationToAdd, Relation.RANGE);
            expandOnEmpty(forms, relationToAdd, Relation.RANGE);
            expandOnEmpty(forms, relationToAdd, Relation.DOMAIN);
        }

        return [forms, relations];
    }
}


function getCustomRelations(forms: Map<TransientFormDefinition>): Array<Relation> {

    return Object.keys(forms).reduce((result, formName) => {
        const form = forms[formName];
        const relations = Object.values(form.fields).filter(field => {
            return field.inputType === Field.InputType.RELATION;
        });
        relations.forEach((relation: Relation) => relation.domain = [form.categoryName]);
        return result.concat(relations);
    }, []);
}


function addSubcategories(forms: Map<TransientFormDefinition>, relation: Relation, itemSet: 'domain'|'range') {

    if (!relation?.[itemSet]) return;

    const newItems: string[] = [];

    for (let categoryName of relation[itemSet]) {
        for (let form of Object.values(forms)) {
            if (form.parent === categoryName && !newItems.includes(form.categoryName)) {
                newItems.push(form.categoryName);
            }
        }
        newItems.push(categoryName);
    }

    relation[itemSet] = newItems;
}


function expandOnEmpty(forms: Map<TransientFormDefinition>, relation: Relation, itemSet: 'domain'|'range') {

    if (not(isEmpty)(relation[itemSet])) return;

    const opposite: 'domain'|'range' = (itemSet === Relation.RANGE) ? Relation.DOMAIN : Relation.RANGE;

    relation[itemSet] = [];
    for (let form of Object.values(forms)) {
        if (!relation[opposite].includes(form.categoryName)) {
            relation[itemSet].push(form.categoryName);
        }
    }
}
