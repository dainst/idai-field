import { Document, FieldGeometryType, ProjectConfiguration } from 'idai-field-core';

interface FillOpacity {
    fill: string;
    opacity: number;
    strokeWidth: number;
    stroke?: string;
    strokeDasharray?: number[];
    strokeOpacity?: number;
}

export const getDocumentFillAndOpacity = (
    document: Document,
    selectedDocuments: Document[],
    noSelectedDocs: boolean,
    config: ProjectConfiguration,
    geoType: FieldGeometryType): FillOpacity => {

     
    const doc_id = document.resource.id;
    const color = config.getColorForCategory(document.resource.category);
    const strokeWidth = 1;

    if(noSelectedDocs) return {
        opacity: 0.8,
        fill: isGeoTypePoint(geoType) ? color : 'none',
        stroke: color,
        strokeOpacity: 1,
        strokeWidth: documentHasNoParents(document) ? 0.5 : strokeWidth };

    for( const doc of selectedDocuments) {
        
        if(doc.resource.id === doc_id){
            return { opacity: 0.5, stroke: color, fill: color, strokeDasharray: [1], strokeWidth };
        }

    }
  
    return {
        opacity: 0.5,
        fill: isGeoTypePoint(geoType) ? color : 'none',
        stroke: color, strokeOpacity: 0.3, strokeWidth };
};

const isGeoTypePoint = (type: FieldGeometryType) => type === 'Point' || type === 'MultiPoint';

const documentHasNoParents = (document: Document): boolean => !Object.keys(document.resource.relations).length;
