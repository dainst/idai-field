import { Document, ProjectConfiguration } from 'idai-field-core';

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
    config: ProjectConfiguration): FillOpacity => {

     
    const doc_id = document.resource.id;
    const color = config.getColorForCategory(document.resource.category);
    const strokeWidth = 0.3;

    if(noSelectedDocs) return {
        opacity: 0.8,
        fill: 'none',
        stroke: color,
        strokeOpacity: 1,
        strokeWidth: documentHasNoParents(document) ? 0.5 : strokeWidth };

    for( const doc of selectedDocuments) {
        
        if(doc.resource.id === doc_id){
            return { opacity: 0.5, stroke: color, fill: color, strokeDasharray: [1], strokeWidth };
        } else if(document.resource.relations.isRecordedIn &&
            document.resource.relations.isRecordedIn.includes(doc.resource.id)){
                return { opacity: 1, fill: color, stroke: 'white', strokeWidth };
        }

    }

    return { opacity: 0.5, fill: 'none', stroke: color, strokeOpacity: 0.3, strokeWidth };
};

const documentHasNoParents = (document: Document): boolean => !Object.keys(document.resource.relations).length;
