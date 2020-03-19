import {UnorderedConfigurationDefinition} from '../model/unordered-configuration-definition';
import {RelationDefinition} from '../model/relation-definition';
import {empty, isNot, on, subtract} from 'tsfun';


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
            for (let typeName of Object.keys(configuration.types)) {
                const type = configuration.types[typeName];

                if (type.parent === item.split(':')[0]) {
                    itemsNew.push(typeName);
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
    for (let typeName of Object.keys(configuration.types)) {
        if (extraRelation[opposite].indexOf(typeName) == -1) {
            extraRelation[itemSet].push(typeName);
        }
    }
}
