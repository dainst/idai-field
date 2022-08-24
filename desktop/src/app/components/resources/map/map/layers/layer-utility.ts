import { ImageDocument, Labels } from 'idai-field-core';


export module LayerUtility {

    export const getLayerLabel = (layer: ImageDocument, labels: Labels): string => {

        let label = labels.getFromI18NString(layer.resource.shortDescription) ?? layer.resource.identifier;

        if (label.length > 55) label = label.substring(0, 52) + '...';

        return label;
    }
}
