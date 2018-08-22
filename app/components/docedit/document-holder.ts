import {Injectable} from '@angular/core';
import {DatastoreErrors, Document, ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../../core/model/validator';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {M} from '../../m';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {Validations} from '../../core/model/validations';
import {TypeUtility} from '../../core/model/type-utility';
import {UsernameProvider} from '../../core/settings/username-provider';
import {clone} from '../../util/object-util';
import {flow, includedIn, isNot, jsonEqual, mapObject, to, uniteObject} from 'tsfun';


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
    public inspectedRevisions: Array<Document>;

    /**
     * Holds a cloned version of the <code>document</code> set via {@link DocumentHolder#setDocument}.
     * On clonedDocument changes can be made which can be either saved or discarded later.
     */
    public clonedDocument: Document;

    private oldVersion: Document;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private imagestore: Imagestore,
        private typeUtility: TypeUtility,
        private usernameProvider: UsernameProvider,
        private datastore: DocumentDatastore) {
    }


    public getClonedDocument = () => this.clonedDocument;


    public isChanged = () => !jsonEqual(this.clonedDocument.resource)(this.oldVersion.resource);


    public changeType(newType: string) {

        this.clonedDocument.resource.type = newType;
        // this.documentEditChangeMonitor.setChanged();
        // TODO set changed

        return {
            invalidFields: this.validateFields(),
            invalidRelations: this.validateRelationFields()
        }
    }


    public setClonedDocument(document: Document) {

        this.oldVersion = clone(document);
        this.clonedDocument = clone(document);
        this.inspectedRevisions = [];
    };


    public async save() {

        this.clonedDocument = await this.cleanup(this.clonedDocument);

        // See #8992
        if (this.typeUtility) {
            if (!Object.keys(
                    flow(this.typeUtility.getSubtypes('Operation'),
                        uniteObject(this.typeUtility.getSubtypes('Image'),
                        mapObject(to('name')))
                    ))
                    .concat(['Place'])
                    .includes(this.clonedDocument.resource.type)) {

                if (!this.clonedDocument.resource.relations.isRecordedIn
                    || this.clonedDocument.resource.relations.isRecordedIn.length !== 1) {
                    throw [M.VALIDATION_ERROR_NORECORDEDIN];
                }
            }
        }

        await this.validator.validate(this.clonedDocument);
        this.clonedDocument = await this.persistenceManager.persist(
            this.clonedDocument,
            this.usernameProvider.getUsername(),
            this.oldVersion,
            this.inspectedRevisions
        );

        await this.fetchLatestRevision();
    }


    public detectSaveConflicts(documentBeforeSave: Document): boolean {

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (this.clonedDocument as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) != undefined;
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

        return flow(
            document,
            Document.removeRelations(this.validateRelationFields()),
            Document.removeRelations(this.getEmptyRelationFields()),
            Document.removeFields(this.validateFields()),
            Document.removeFields(this.getEmptyFields())
        )
    }


    private async fetchLatestRevision() {

        try {
            this.clonedDocument = await this.datastore.get(
                this.clonedDocument.resource.id, { skip_cache: true }
            );
        } catch (e) {

            throw [M.DATASTORE_NOT_FOUND];
        }
    }


    private async removeImageWithImageStore(): Promise<any> {

        if (!this.typeUtility.isSubtype(this.clonedDocument.resource.type, 'Image')) return undefined;

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        try {
            await this.imagestore.remove(this.clonedDocument.resource.id as any);
        } catch (_) {
            return [M.IMAGESTORE_ERROR_DELETE, this.clonedDocument.resource.id];
        }
    }


    private async removeWithPersistenceManager(): Promise<any> {

        try {
            await this.persistenceManager.remove(this.clonedDocument, this.usernameProvider.getUsername())
        } catch(removeError) {

            console.error('removeWithPersistenceManager', removeError);
            if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) {
                throw [M.DOCEDIT_DELETE_ERROR];
            }
        }
    }


    private validateFields(): Array<string> {

        return Validations.validateFields(this.clonedDocument.resource, this.projectConfiguration);
    }


    private validateRelationFields(): Array<string> {

        return Validations.validateRelations(this.clonedDocument.resource, this.projectConfiguration);
    }


    private getEmptyRelationFields(): Array<string> {

        return Object.keys(this.clonedDocument.resource.relations).filter(relationName =>
                this.clonedDocument.resource.relations[relationName].length === 0
            );
    }


    private getEmptyFields(): Array<string> {

        return Object.keys(this.clonedDocument.resource)
            .filter(_ =>
                (typeof(this.clonedDocument.resource[_]) === 'string')
                && this.clonedDocument.resource[_].length === 0
            );
    }
}