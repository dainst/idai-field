import { isEmpty, not, on, subtract, Map } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { Named } from '../../tools/named';
import { TransientCategoryDefinition } from '../model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function addRelations(extraRelations: Array<Relation>) {

    return (configuration: [any, any]) => {

        let [categories, relations] = configuration;

        if (!relations) return;

        for (let extraRelation of extraRelations) {
            expandInherits(categories, extraRelation, Relation.DOMAIN);

            relations
                .filter(on(Named.NAME)(extraRelation))
                .forEach((relation: any) => {
                    relation.domain = subtract(extraRelation.domain)(relation.domain)
                });
            relations = relations
                .filter(not(on(Relation.DOMAIN, isEmpty)));

            relations.splice(0,0, extraRelation);

            expandInherits(categories, extraRelation, Relation.RANGE);
            expandOnEmpty(categories, extraRelation, Relation.RANGE);
            expandOnEmpty(categories, extraRelation, Relation.DOMAIN);
        }

        return [categories, relations];
    }
}


function expandInherits(categories: Map<TransientCategoryDefinition>,
                        extraRelation: Relation, itemSet: string) {

    if (!extraRelation) return;
    if (!(extraRelation as any)[itemSet]) return;

    const itemsNew = [] as any;
    for (let item of (extraRelation as any)[itemSet]) {

        if (item.indexOf(':inherit') !== -1) {
            for (let key of Object.keys(categories)) {
                const category: TransientCategoryDefinition = categories[key];
                if (category.parent === item.split(':')[0]) {
                    itemsNew.push(category.categoryName ?? key);
                }
            }
            itemsNew.push(item.split(':')[0]);
        } else {
            itemsNew.push(item);
        }


    }
    (extraRelation as any)[itemSet] = itemsNew;
}


function expandOnEmpty(categories: any,
                       extraRelation_: Relation, itemSet: string) {

    const extraRelation: any = extraRelation_;

    if (not(isEmpty)(extraRelation[itemSet])) return;

    let opposite = Relation.RANGE;
    if (itemSet === Relation.RANGE) opposite = Relation.DOMAIN;

    extraRelation[itemSet] = [];
    for (let key of Object.keys(categories)) {
        const categoryName = categories[key].categoryName ?? key;
        if (extraRelation[opposite].indexOf(categoryName) === -1) {
            extraRelation[itemSet].push(categoryName);
        }
    }
}
