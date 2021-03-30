import {empty, isNot, on, subtract} from 'tsfun';
import {Named, RelationDefinition} from 'idai-field-core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function addRelations(extraRelations: Array<RelationDefinition>) {

    return (configuration: [any, any]) => {

        let [categories, relations] = configuration;

        if (!relations) return;

        for (let extraRelation of extraRelations) {
            expandInherits(categories, extraRelation, RelationDefinition.DOMAIN);

            relations
                .filter(on(Named.NAME)(extraRelation))
                .forEach((relation: any) => {
                    relation.domain = subtract(extraRelation.domain)(relation.domain)
                });
            relations = relations
                .filter(isNot(on(RelationDefinition.DOMAIN, empty)));

            relations.splice(0,0, extraRelation);

            expandInherits(categories, extraRelation, RelationDefinition.RANGE);
            expandOnEmpty(categories, extraRelation, RelationDefinition.RANGE);
            expandOnEmpty(categories, extraRelation, RelationDefinition.DOMAIN);
        }

        return [categories, relations];
    }
}


function expandInherits(categories: any,
                        extraRelation: RelationDefinition, itemSet: string) {

    if (!extraRelation) return;
    if (!(extraRelation as any)[itemSet]) return;

    const itemsNew = [] as any;
    for (let item of (extraRelation as any)[itemSet]) {

        if (item.indexOf(':inherit') !== -1) {
            for (let categoryName of Object.keys(categories)) {
                const category = categories[categoryName];

                if (category.parent === item.split(':')[0]) {
                    itemsNew.push(categoryName);
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
                       extraRelation_: RelationDefinition, itemSet: string) {

    const extraRelation: any = extraRelation_;

    if (isNot(empty)(extraRelation[itemSet])) return;

    let opposite = RelationDefinition.RANGE;
    if (itemSet === RelationDefinition.RANGE) opposite = RelationDefinition.DOMAIN;

    extraRelation[itemSet] = [];
    for (let categoryName of Object.keys(categories)) {
        if (extraRelation[opposite].indexOf(categoryName) === -1) {
            extraRelation[itemSet].push(categoryName);
        }
    }
}
