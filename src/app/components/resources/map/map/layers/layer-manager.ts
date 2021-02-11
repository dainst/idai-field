import {Injectable} from '@angular/core';
import {set, subtract} from 'tsfun';
import {FieldDocument, ImageDocument, Document} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../../core/datastore/field/image-read-datastore';
import {ViewFacade} from '../../../../../core/resources/view/view-facade';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {ImageRelations} from '../../../../../core/model/relation-constants';
import {RelationsManager} from '../../../../../core/model/relations-manager';
import {clone} from '../../../../../core/util/object-util';
import {moveInArray} from '../../../../../core/util/utils';


export interface LayersInitializationResult {

    layerGroups: Array<LayerGroup>,
    activeLayersChange: ListDiffResult
}

export interface LayerGroup {

    document?: FieldDocument,
    layers: Array<ImageDocument>,
}

export interface ListDiffResult {

    added: Array<string>,
    removed: Array<string>
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerManager {

    private activeLayerIds: string[] = [];
    private unsavedDocuments: Array<FieldDocument> = [];


    constructor(private imageDatastore: ImageReadDatastore,
                private fieldDatastore: FieldReadDatastore,
                private viewFacade: ViewFacade,
                private relationsManager: RelationsManager) {}


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);


    public async initializeLayers(skipRemoval: boolean = false): Promise<LayersInitializationResult> {

        if (!skipRemoval) await this.removeNonExistingLayers();

        const activeLayersChange = LayerManager.computeActiveLayersChange(
            this.viewFacade.getActiveLayersIds(),
            this.activeLayerIds);

        this.activeLayerIds = this.viewFacade.getActiveLayersIds();

        try {
            return {
                layerGroups: await this.createLayerGroups(),
                activeLayersChange: activeLayersChange
            };
        } catch(e) {
            console.error('error with datastore.find', e);
            throw undefined;
        }
    }


    public toggleLayer(resourceId: string) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            subtract([resourceId])(this.activeLayerIds) :
            set(this.activeLayerIds.concat([resourceId]));

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    public async addLayers(group: LayerGroup, newLayers: Array<ImageDocument>) {

        const oldDocument: FieldDocument = clone(group.document);

        const layerIds: string[] = group.document.resource.relations[ImageRelations.HASLAYER] || [];
        const newLayerIds: string[] = newLayers.map(layer => layer.resource.id);
        group.document.resource.relations[ImageRelations.HASLAYER] = layerIds.concat(newLayerIds);

        await this.relationsManager.update(group.document, oldDocument);
    }


    public async removeLayer(group: LayerGroup, layerToRemove: ImageDocument) {

        const oldDocument: FieldDocument = clone(group.document);

        group.document.resource.relations[ImageRelations.HASLAYER]
            = group.document.resource.relations[ImageRelations.HASLAYER].filter(id => {
                return id !== layerToRemove.resource.id;
            });
        
        await this.relationsManager.update(group.document, oldDocument);
    }


    public async changeOrder(group: LayerGroup, originalIndex: number, targetIndex: number) {

        const relations: string[] = group.document.resource.relations[ImageRelations.HASLAYER];

        moveInArray(group.layers, originalIndex, targetIndex);
        moveInArray(relations, originalIndex, targetIndex);
        if (!this.unsavedDocuments.includes(group.document)) {
            this.unsavedDocuments.push(group.document);
        }
    }


    public async saveOrderChanges() {

        for (let document of this.unsavedDocuments) {
            await this.relationsManager.update(document);
        }

        this.unsavedDocuments = [];
    }


    private async removeNonExistingLayers() {

        const newActiveLayersIds = this.viewFacade.getActiveLayersIds();

        let i = newActiveLayersIds.length;
        while (i--) {
            try {
                await this.imageDatastore.get(newActiveLayersIds[i])
            } catch (_) {
                newActiveLayersIds.splice(i, 1);
                this.viewFacade.setActiveLayersIds(newActiveLayersIds);
            }
        }
    }


    private async createLayerGroups(): Promise<Array<LayerGroup>> {

        const layerGroups: Array<LayerGroup> = [];

        const currentOperation: FieldDocument|undefined = this.viewFacade.getCurrentOperation();
        if (currentOperation) layerGroups.push(await this.createLayerGroup(currentOperation));

        layerGroups.push(await this.createLayerGroup(await this.fieldDatastore.get('project')));
        layerGroups.push(await this.createLayerGroup());

        return layerGroups;
    }


    private async createLayerGroup(document?: FieldDocument): Promise<LayerGroup> {

        return {
            document: document,
            layers: document
                ? await this.fetchLinkedLayers(document)
                : await this.fetchUnlinkedLayers()
        };
    }


    private async fetchLinkedLayers(document: FieldDocument): Promise<Array<ImageDocument>> {

        return Document.hasRelations(document, ImageRelations.HASLAYER)
            ? await this.imageDatastore.getMultiple(document.resource.relations[ImageRelations.HASLAYER])
            : [];
    }


    private async fetchUnlinkedLayers(): Promise<Array<ImageDocument>> {

        const constraints = {
            'georeference:exist': 'KNOWN',
            'isLayerOf:exist': 'UNKNOWN'
        };

        return (await this.imageDatastore.find({ constraints })).documents;
    }


    private static computeActiveLayersChange(newActiveLayerIds: string[],
                                             oldActiveLayerIds: string[]): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}