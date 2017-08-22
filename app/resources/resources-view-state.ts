export interface ResourcesViewState {
    mainTypeDocumentId?: string;
    type?: string;
    mode?: string;
    layerIds?: {[mainTypeDocumentId: string]: string[]}
}
