import {empty, isNot, on, subtract} from 'tsfun';
import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';
import {RelationDefinition} from '../model/relation-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function addRelations(extraRelations: Array<RelationDefinition>) {

    return (configuration: UnorderedConfigurationDefinition) => {

        if (!configuration.relations) return;

        for (let extraRelation of extraRelations) {

            expandInherits(configuration, extraRelation, 'domain');

            configuration.relations
                .filter(on('name')(extraRelation))
                .forEach(relation => {
                    relation.domain = subtract(extraRelation.domain)(relation.domain)
                });
            configuration.relations = configuration.relations.filter(isNot(on('domain', empty)));

            configuration.relations.splice(0,0, extraRelation);

            expandInherits(configuration, extraRelation, 'range');
            expandOnUndefined(configuration, extraRelation, 'range');
            expandOnUndefined(configuration, extraRelation, 'domain');
        }

        return configuration;
    }
}


function expandInherits(configuration: Readonly<UnorderedConfigurationDefinition>,
                        extraRelation: RelationDefinition, itemSet: string) {

    if (!extraRelation) return;
    if (!(extraRelation as any)[itemSet]) return;

    const itemsNew = [] as any;
    for (let item of (extraRelation as any)[itemSet]) {

        if (item.indexOf(':inherit') !== -1) {
            for (let categoryName of Object.keys(configuration.categories)) {
                const category = configuration.categories[categoryName];

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


function expandOnUndefined(configuration: UnorderedConfigurationDefinition,
                           extraRelation_: RelationDefinition, itemSet: string) {

    const extraRelation: any = extraRelation_;

    if (extraRelation[itemSet] != undefined) return;

    let opposite = 'range';
    if (itemSet == 'range') opposite = 'domain';

    extraRelation[itemSet] = [];
    for (let categoryName of Object.keys(configuration.categories)) {
        if (extraRelation[opposite].indexOf(categoryName) == -1) {
            extraRelation[itemSet].push(categoryName);
        }
    }
}
