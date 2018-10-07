import {Injectable} from '@angular/core';
import {flow, includedIn, isEmpty, isNot, jsonEqual} from 'tsfun';
import {DatastoreErrors, Document, ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../../core/model/validator';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {Validations} from '../../core/model/validations';
import {TypeUtility} from '../../core/model/type-utility';
import {UsernameProvider} from '../../core/settings/username-provider';
import {clone} from '../../core/util/object-util';
import {M} from '../m';
import {Model3DStore} from '../core-3d/model-3d-store';


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
        private model3DStore: Model3DStore,
        private typeUtility: TypeUtility,
        private usernameProvider: UsernameProvider,
        private datastore: DocumentDatastore) {
    }


    public getClonedDocument = () => this.clonedDocument;


    public isChanged(): boolean {

        if (!this.clonedDocument) return false;

        return (this.inspectedRevisions.length > 0
            || !jsonEqual(this.clonedDocument.resource)(this.oldVersion.resource));
    }


    public changeType(newType: string) {

        this.clonedDocument.resource.type = newType;

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


    public async save(): Promise<Document> {

        await this.validator.validate(this.clonedDocument, true);

        const savedDocument: Document = await this.persistenceManager.persist(
            this.cleanup(this.clonedDocument),
            this.usernameProvider.getUsername(),
            this.oldVersion,
            this.inspectedRevisions
        );

        return this.fetchLatestRevision(savedDocument.resource.id);
    }


    public makeClonedDocAppearNew() {

        // make the doc appear 'new' ...
        delete this.clonedDocument.resource.id; // ... for persistenceManager
        delete (this.clonedDocument as any)['_id'];      // ... for pouchdbdatastore
        delete (this.clonedDocument as any)['_rev'];
    }


    public async remove() {

        await this.removeAssociatedMediaFiles();
        await this.removeWithPersistenceManager();
    }


    private cleanup(document: Document): Document {

        return flow(
            document,
            Document.removeRelations(this.validateRelationFields()),
            Document.removeRelations(this.getEmptyRelationFields()),
            Document.removeFields(this.validateFields()),
            Document.removeFields(this.getEmptyFields())
        )
    }


    private async fetchLatestRevision(id: string): Promise<Document> {

        try {
            return await this.datastore.get(id, { skip_cache: true });
        } catch (e) {
            throw [M.DATASTORE_NOT_FOUND];
        }
    }


    private async removeAssociatedMediaFiles(): Promise<any> {

        if (this.typeUtility.isSubtype(this.clonedDocument.resource.type, 'Image')) {
            if (!this.imagestore.getPath()) {
                return Promise.reject([M.IMAGESTORE_ERROR_INVALID_PATH_DELETE]);
            }
            return this.imagestore.remove(this.clonedDocument.resource.id).catch(() => {
                return [M.IMAGESTORE_ERROR_DELETE, this.clonedDocument.resource.id];
            });
        } else if (this.typeUtility.isSubtype(this.clonedDocument.resource.type, 'Model3D')) {
            return this.model3DStore.remove(this.clonedDocument.resource.id);
        } else {
            return Promise.resolve();
        }
    }


    private async removeWithPersistenceManager(): Promise<any> {

        try {
            await this.persistenceManager.remove(this.clonedDocument, this.usernameProvider.getUsername())
        } catch (removeError) {
            console.error('removeWithPersistenceManager', removeError);
            if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) throw [M.DOCEDIT_DELETE_ERROR];
        }
    }


    private validateFields(): Array<string> {

        return this.validateButKeepInvalidOldVersionFields(Validations.validateFields);
    }


    private validateRelationFields(): Array<string> {

        return this.validateButKeepInvalidOldVersionFields(Validations.validateRelations);
    }


    private validateButKeepInvalidOldVersionFields(validate: (_: any, __: any) => Array<string>): Array<string> {

        const validationResultClonedVersion = validate(this.clonedDocument.resource, this.projectConfiguration);
        const validationResultOldVersion = validate(this.oldVersion.resource, this.projectConfiguration);

        return validationResultClonedVersion.filter(isNot(includedIn(validationResultOldVersion)));
    }


    private getEmptyRelationFields(): Array<string> {

        return Object
            .keys(this.clonedDocument.resource.relations)
            .filter(relationName => isEmpty(this.clonedDocument.resource.relations[relationName]));
    }


    private getEmptyFields(): Array<string> {

        return Object.keys(this.clonedDocument.resource)
            .filter(_ =>
                (typeof(this.clonedDocument.resource[_]) === 'string')
                && this.clonedDocument.resource[_].length === 0
            );
    }
}