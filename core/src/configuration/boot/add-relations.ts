import { isEmpty, not, on, subtract, Map, keysValues, set } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { Named } from '../../tools/named';
import { TransientFormDefinition } from '../model/form/transient-form-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function addRelations(relationsToAdd: Array<Relation>) {

    return (configuration: [any, any]) => {

        let [forms, relations] = configuration;

        if (!relations) return;

        for (let relationToAdd of relationsToAdd) {
            expandInherits(forms, relationToAdd, Relation.DOMAIN);

            relations.filter(on(Named.NAME)(relationToAdd))
                .forEach((relation: any) => {
                    relation.domain = subtract(relationToAdd.domain)(relation.domain)
                });
            relations = relations.filter(not(on(Relation.DOMAIN, isEmpty)));

            relations.splice(0,0, relationToAdd);

            expandInherits(forms, relationToAdd, Relation.RANGE);
            expandOnEmpty(forms, relationToAdd, Relation.RANGE);
            expandOnEmpty(forms, relationToAdd, Relation.DOMAIN);
        }

        return [forms, relations];
    }
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
