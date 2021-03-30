import {ImageDocument} from 'idai-field-core';


export module LayerUtility {

    export const getLayerLabel = (layer: ImageDocument): string => {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 55) label = label.substring(0, 52) + '...';

        return label;
    }
}
