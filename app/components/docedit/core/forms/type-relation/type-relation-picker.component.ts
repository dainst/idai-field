import {Component, OnChanges} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Pair, first, second} from 'tsfun';
import {asyncMap} from 'tsfun-extra';
import {Resource, FieldDocument, Query} from 'idai-components-2';
import {ResourceId} from '../../../../../core/constants';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';
import getIdsOfLinkedImages = TypeImagesUtil.getIdsOfLinkedImages;
import {suggestTypeRelations} from '../../../../../core/docedit/core/type-relation/suggest-type-relations';


@Component({
    selector: 'type-relation-picker',
    moduleId: module.id,
    templateUrl: './type-relation-picker.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRelationPickerComponent {

    public resource: Resource | undefined = undefined;

    public timeoutRef: any;

    public typeDocument = first;
    public imageIds = second;
    public typeDocumentsWithLinkedImageIds: Array<Pair<FieldDocument, ResourceId[]>> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {}


    public setResource(resource: Resource) {

        this.resource = resource;
        this.fetchTypes();
    }


    public setQueryString(q: string) {

        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.fetchTypes(q), 200);
    }


    private async fetchTypes(q: string = '') {

        if (!this.resource) return;

        const rankedDocuments =
            await suggestTypeRelations(
                (q: Query) => this.datastore.find(q),
                this.resource.type,
                q);

        this.typeDocumentsWithLinkedImageIds =
            await this.pairWithLinkedImageIds(rankedDocuments);
    }


    private pairWithLinkedImageIds = asyncMap(async (document: FieldDocument) => {
        return [
            document,
            await getIdsOfLinkedImages(document, this.datastore)
        ] as Pair<FieldDocument, ResourceId[]>;
    });
}