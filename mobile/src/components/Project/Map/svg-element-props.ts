import { Document, FieldGeometryType, ProjectConfiguration } from 'idai-field-core';
import { strokeWidth } from './geo-svg/constants';

interface ElementProps {
    fill: string;
    opacity: number;
    strokeWidth: number;
    onPress?: () => void;
    stroke?: string;
    strokeDasharray?: number[];
    strokeOpacity?: number;
}

export const getDocumentFillOpacityPress = (
    document: Document,
    selectedDocuments: Document[],
    config: ProjectConfiguration,
    geoType: FieldGeometryType,
    onPressHandler: () => void,
    highlightedDoc: Document | null): ElementProps => {

     
    const doc_id = document.resource.id;
    const color = config.getColorForCategory(document.resource.category);


    for( const doc of selectedDocuments) {
        
        if(doc.resource.id === doc_id){
            return {
                opacity: 0.5,
                stroke: isHighlightedDoc(doc,highlightedDoc) ? 'white' : color,
                fill: color,
                strokeWidth: isHighlightedDoc(doc,highlightedDoc) ? 6 : strokeWidth,
                onPress: onPressHandler
             };
        }

    }
  
    return {
        opacity: 0.5,
        fill: isGeoTypePoint(geoType) ? color : 'none',
        stroke: color, strokeOpacity: 0.3, strokeWidth };
};

const isGeoTypePoint = (type: FieldGeometryType) => type === 'Point' || type === 'MultiPoint';

const isHighlightedDoc = (doc: Document, highlightedDoc: Document | null) =>
    highlightedDoc ? highlightedDoc._id === doc._id : false;