import {subtractO} from 'tsfun';
import {Validator} from '../../core/model/validator';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Document, Resource} from 'idai-components-2/core';
import {PersistenceManager} from '../../core/persist/persistence-manager';
import {ObjectUtil} from '../../util/object-util';
import {M} from '../../m';
import {Imagestore} from '../../core/imagestore/imagestore';
import {SettingsService} from '../../core/settings/settings-service';
import {DatastoreErrors} from 'idai-components-2/datastore';
import {ImageTypeUtility} from '../../common/image-type-utility';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {Injectable} from '@angular/core';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DocumentHolder {


    /**
     * These are the revisions (of the cloned document as long as not saved)
     * that are conflict resolved. They will be be removed from document
     * as soon as it gets saved.
     */
    public inspectedRevisionsIds: string[];

    /**
     * Holds a cloned version of the <code>document</code> set via {@link DocumentHolder#setDocument}.
     * On clonedDocument changes can be made which can be either saved or discarded later.
     */
    public clonedDocument: Document;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private imagestore: Imagestore,
        private imageTypeUtility: ImageTypeUtility,
        private settingsService: SettingsService,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private datastore: DocumentDatastore) {

    }


    public isChanged = () => this.documentEditChangeMonitor.isChanged();

    public getClonedDocument = () => this.clonedDocument;


    public changeType(newType: string) {

        this.clonedDocument.resource.type = newType;
        this.documentEditChangeMonitor.setChanged();

        return {
            invalidFields: this.validateFields(),
            invalidRelations: this.validateRelationFields()
        }
    }


    public setClonedDocument(document: Document) {

        this.persistenceManager.setOldVersions([document]);
        this.clonedDocument = ObjectUtil.cloneObject(document);
        this.inspectedRevisionsIds = [];
    };


    public async save() {

        this.clonedDocument = await this.cleanup(this.clonedDocument);

        await this.validator.validate(this.clonedDocument);
        await this.persistenceManager.persist(this.clonedDocument, this.settingsService.getUsername());

        await this.removeInspectedRevisions();
        await this.fetchLatestRevision();
        this.documentEditChangeMonitor.reset();
    }


    public detectSaveConflicts(documentBeforeSave: Document): boolean {

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (this.clonedDocument as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        // TODO factor out abstract method which tests one set contains at least one element of another
        for (let conflict of conflictsAfterSave) {
            if (conflictsBeforeSave.indexOf(conflict) == -1) {
                return true;
            }
        }

        return false;
    }


    public makeClonedDocAppearNew() {

        // make the doc appear 'new' ...
        delete this.clonedDocument.resource.id; // ... for persistenceManager
        delete (this.clonedDocument as any)['_id'];      // ... for pouchdbdatastore
        delete (this.clonedDocument as any)['_rev'];
    }


    public async remove() {

        await this.removeImageWithImageStore();
        await this.removeWithPersistenceManager();
    }


    private async cleanup(document: Document): Promise<Document> {

        // TODO make synchronous and make function pure
        await this.removeInvalidLiesWithinRelationTargets(document);

        return Document.removeRelations(
            Document.removeFields(document, this.validateFields())
            , this.validateRelationFields());
    }


    private async fetchLatestRevision() {

        try {
            this.clonedDocument = await this.datastore.get(this.clonedDocument.resource.id as any, {skip_cache: true});
        } catch (e) {
            throw [M.DATASTORE_NOT_FOUND];
        }
    }


    private removeInspectedRevisions(): Promise<any> {

        let promises = [] as any;
        for (let revisionId of this.inspectedRevisionsIds) {
            promises.push(this.datastore.removeRevision(this.clonedDocument.resource.id as any, revisionId) as never);
        }
        this.inspectedRevisionsIds = [];

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_GENERIC_ERROR]));
    }


    private async removeImageWithImageStore(): Promise<any> {

        if (!this.imageTypeUtility.isImageType(this.clonedDocument.resource.type)) return undefined;

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        try {
            await this.imagestore.remove(this.clonedDocument.resource.id as any);
        } catch (_) {
            return [M.IMAGESTORE_ERROR_DELETE, this.clonedDocument.resource.id];
        }
    }


    private async removeWithPersistenceManager(): Promise<any> {

        try {
            await this.persistenceManager.remove(this.clonedDocument, this.settingsService.getUsername())
        } catch(removeError) {
            if (removeError != DatastoreErrors.DOCUMENT_NOT_FOUND) {
                throw [M.DOCEDIT_DELETE_ERROR];
            }
        }
    }


    private async removeInvalidLiesWithinRelationTargets(document: Document): Promise<any> {

        const invalidRelationTargetIds: string[]
            = await this.validator.validateRelationTargets(document, 'liesWithin');

        if (invalidRelationTargetIds.length == 0) return;

        // TODO remove only the invalid targets
        delete document.resource.relations['liesWithin'];

        return Promise.reject([M.DOCEDIT_LIESWITHIN_RELATION_REMOVED_WARNING]);
    }



    private validateFields(): Array<string>  {

        return Validator.validateFields(this.clonedDocument.resource, this.projectConfiguration);
    }

    private validateRelationFields(): Array<string> {

        return Validator.validateRelations(this.clonedDocument.resource, this.projectConfiguration);
    }
}