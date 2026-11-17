import { Geojson } from './geojson-parser';
import { ParserErrors } from './parser-errors';


export interface GazetteerProperties {

    prefName: {
        title: string;
    };
    identifier: string;
    id: string;
    gazId: string;
    category: string;
    geometry: { type: string };
    parent: string;
    relations: any;
}


/**
 * @author Daniel de Oliveira
 */
export module GazGeojsonParserAddOn {

    const placePath = 'https://gazetteer.dainst.org/place/';


    export function postProcess(content: Geojson) {

        const foundIds: string[] = [];
        for (let feature of content.features) {
            if (!foundIds.includes(feature.properties['id'])) {
                foundIds.push(feature.properties['id']);
            }
        }

        const parentsNotFound: string[] = [];
        for (let feature of content.features) {
            if (!feature.properties.relations['liesWithin']) continue;
            const parent = feature.properties.relations['liesWithin'][0];
            if (!foundIds.includes(parent)) {
                feature.properties.relations = {};
                if (!parentsNotFound.includes(parent)) parentsNotFound.push(parent);
            }
        }
    }


    export function preValidateAndTransformFeature(feature: any, identifiers: string[]) {

        const properties = feature.properties as GazetteerProperties;
        if (!properties.gazId) return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "properties.gazId" not found for at least one feature.'];

        transformGeometryCollection(feature);

        const identifier = determineIdentifier(properties, identifiers);
        identifiers.push(identifier);
        properties.identifier = identifier;

        properties.category = 'Place';
        properties.id = 'gazetteer' + properties.gazId;
        if (properties.parent) properties.relations['liesWithin'] =
            ['gazetteer' + (properties.parent as any).replace(placePath, '')];

        (properties as any)['shortDescription'] = extractShortDescription(properties);
    }


    function extractShortDescription(properties: any) {

        if ((properties as any)['comments']
            && (properties as any)['comments'].length > 0
            && (properties as any)['comments'][0]['text']) {
             return (properties as any)['comments'][0]['text'];
        }
        return undefined;
    }


    function determineIdentifier(properties: any, identifiers: string[]) {

        const identifier = properties.prefName && properties.prefName.title
            ? properties.prefName.title
            : properties.gazId;
        let nr = 1;
        let suffixedIdentifier = identifier;
        while (identifiers.includes(suffixedIdentifier)) {
            suffixedIdentifier = identifier + ' (' + nr + ')';
            nr += 1;
        }
        return suffixedIdentifier;
    }


    function transformGeometryCollection(feature: any) {

        if (feature.geometry.type !== 'GeometryCollection') return;

        const geometries = (feature.geometry as any)['geometries'];

        const nrGeometries = geometries.length;
        if (nrGeometries === 0) return delete feature.geometry;

        const nrPoints = geometries.filter((_: any) => _.type === 'Point').length;

        feature.geometry = nrGeometries > nrPoints
            ? geometries.find(((_: any) => _.type !== 'Point'))
            : geometries[0];
    }
}