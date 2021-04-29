import { Document } from 'idai-field-core';

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
    noSelectedDocs: boolean): FillOpacity => {

     
    const doc_id = document.resource.id;
    const color = getColorForCategory(document.resource.type);
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

const getColorForCategory = (type: string): string => {

    switch(type){
        case('Feature'): return '#9E7B51';
        case('Building'): return '#8033FF';
        case('Survey'): return '#519E63';
        case('Architecture'): return '#5D635B';
        case('Room'): return '#A9DDD6';
        case('Trench'): return '#33A2FF';
        case('Layer'): return '#C3C7AF';
        default: return '#D14233';
    }
};

const documentHasNoParents = (document: Document): boolean => !Object.keys(document.resource.relations).length;