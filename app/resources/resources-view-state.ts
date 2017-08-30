export interface ResourcesViewState {
    mainTypeDocumentId?: string;
    types?: string[];
    mode?: string;
    layerIds?: {[mainTypeDocumentId: string]: string[]}
}
