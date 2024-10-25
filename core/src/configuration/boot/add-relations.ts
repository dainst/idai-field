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
            expandInherits(forms, relationToAdd, Relation.DOMAIN);

            relations.filter(on(Named.NAME)(relationToAdd))
                .forEach((relation: any) => {
                    relation.domain = subtract(relationToAdd.domain)(relation.domain)
                });
            relations = relations.filter(not(on(Relation.DOMAIN, isEmpty)));

            relations.splice(0, 0, relationToAdd);

            expandInherits(forms, relationToAdd, Relation.RANGE);
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
        relations.forEach(relation => addDomain(relation as Relation, form));
        return result.concat(relations);
    }, []);
}


function addDomain(relation: Relation, form: TransientFormDefinition) {

    let domainName: string = form.categoryName;
    if (!form.parent) domainName += ':inherit';
    relation.domain = [domainName];
}


function expandInherits(forms: Map<TransientFormDefinition>, relation: Relation, itemSet: string) {

    if (!relation) return;
    if (!(relation as any)[itemSet]) return;

    const newItems: string[] = [];
    for (let item of (relation as any)[itemSet]) {
        if (item.indexOf(':inherit') !== -1) {
            for (let form of Object.values(forms)) {
                if (form.parent === item.split(':')[0] && !newItems.includes(form.categoryName)) {
                    newItems.push(form.categoryName);
                }
            }
            newItems.push(item.split(':')[0]);
        } else {
            newItems.push(item);
        }
    }
    relation[itemSet] = newItems;
}


function expandOnEmpty(forms: Map<TransientFormDefinition>, relation: Relation, itemSet: string) {

    if (not(isEmpty)(relation[itemSet])) return;

    let opposite = Relation.RANGE;
    if (itemSet === Relation.RANGE) opposite = Relation.DOMAIN;

    relation[itemSet] = [];
    for (let form of Object.values(forms)) {
        if (relation[opposite].indexOf(form.categoryName) === -1) {
            relation[itemSet].push(form.categoryName);
        }
    }
}
