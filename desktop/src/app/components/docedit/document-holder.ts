import { and, equal, filter, flow, includedIn, isEmpty, isNot, isObject, isString, keys } from 'tsfun';
import { CategoryForm, Document, Datastore, Field, NewDocument, Resource, ProjectConfiguration,
    RelationsManager, IdGenerator } from 'idai-field-core';
import { Validations } from '../../model/validations';
import { Validator } from '../../model/validator';
import { trimFields } from '../../util/trim-fields';
import { DoceditErrors } from './docedit-errors';
import { DuplicationUtil } from './duplication-util';


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

    public oldVersion: Document;


    constructor(private projectConfiguration: ProjectConfiguration,
                private relationsManager: RelationsManager,
                private validator: Validator,
                private datastore: Datastore,
                private idGenerator: IdGenerator) {}


    public isChanged(): boolean {

        if (!this.clonedDocument) return false;

        return (this.inspectedRevisions.length > 0 || !equal(this.clonedDocument.resource)(this.oldVersion.resource));
    }


    /**
     * @returns names of invalid fields that would be deleted when saving 
     */
    public changeCategories(newCategory: string): string[] {

        this.clonedDocument.resource.category = newCategory;

        return this.validateFields().concat(this.validateRelationFields());
    }


    public setDocument(document: Document) {

        this.oldVersion = Document.clone(document);
        this.clonedDocument = Document.clone(document);
        this.inspectedRevisions = [];
    };


    public isNewDocument(): boolean {

        return this.clonedDocument && !this.clonedDocument.resource.id;
    }


    /**
     * @throws [DoceditErrors.NOT_FOUND]
     */
    public async save(): Promise<Document> {

        if (this.isNewDocument()) this.addScanCodeIfConfigured(this.clonedDocument);

        await this.performAssertions();
        this.convertStringsToNumbers();

        const savedDocument: Document = await this.relationsManager.update(
            this.cleanup(this.clonedDocument),
            this.oldVersion,
            this.inspectedRevisions
        );

        return this.fetchLatestRevision(savedDocument.resource.id);
    }


    /**
     * @throws [DoceditErrors.NOT_FOUND]
     */
    public async duplicate(numberOfDuplicates: number): Promise<Array<Document>> {

        const result: Array<Document> = [];
        result.push(await this.save());

        const template: NewDocument = DuplicationUtil.createTemplate(result[0]);

        let { baseIdentifier, identifierNumber, minDigits } =
            DuplicationUtil.splitIdentifier(template.resource.identifier);

        for (let i = 0; i < numberOfDuplicates; i++) {
            identifierNumber = await DuplicationUtil.setUniqueIdentifierForDuplicate(
                template, baseIdentifier, identifierNumber, minDigits, this.validator
            );
            this.addScanCodeIfConfigured(template);

            const duplicatedDocument: Document = await this.relationsManager.update(
                template,
                this.oldVersion,
                []
            );

            result.push(duplicatedDocument);
        }

        return result;
    }


    public makeClonedDocAppearNew() {

        // make the doc appear 'new' ...
        delete this.clonedDocument.resource.id; // ... for relationsManager
        delete this.clonedDocument._id;      // ... for pouchdbdatastore
        delete this.clonedDocument._rev;
    }


    private async performAssertions() {

        await this.validator.assertIdentifierIsUnique(this.clonedDocument);
        this.validator.assertHasIsRecordedIn(this.clonedDocument);
        Validations.assertNoFieldsMissing(this.clonedDocument, this.projectConfiguration);
        Validations.assertMaxCharactersRespected(this.clonedDocument, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(this.clonedDocument, this.projectConfiguration, true,
            this.oldVersion);
        Validations.assertCorrectnessOfUrls(this.clonedDocument, this.projectConfiguration, this.oldVersion);
        Validations.assertUsageOfDotAsDecimalSeparator(this.clonedDocument, this.projectConfiguration);
        Validations.assertCorrectnessOfDates(this.clonedDocument, this.projectConfiguration, this.oldVersion);
        Validations.assertCorrectnessOfDatingValues(this.clonedDocument, this.projectConfiguration, this.oldVersion);
        Validations.assertCorrectnessOfDimensionValues(this.clonedDocument, this.projectConfiguration,
            this.oldVersion);
        Validations.assertCorrectnessOfLiteratureValues(this.clonedDocument, this.projectConfiguration,
            this.oldVersion);
        await this.validator.assertGeometryIsValid(this.clonedDocument);
    }


    private convertStringsToNumbers() {

        const category: CategoryForm = this.projectConfiguration.getCategory(this.clonedDocument);

        for (let fieldName in this.clonedDocument.resource) {
            const field: Field|undefined
                = CategoryForm.getFields(category).find(field => field.name === fieldName);
            if (!field) continue;

            if (field.inputType === 'unsignedInt') {
                this.clonedDocument.resource[fieldName] = parseInt(this.clonedDocument.resource[fieldName]);
            } else if (field.inputType === 'float' || field.inputType === 'unsignedFloat') {
                this.clonedDocument.resource[fieldName] = parseFloat(this.clonedDocument.resource[fieldName]);
            }
        }
    }


    private cleanup(document: Document): Document {

        trimFields(document.resource);

        document = flow(
            document,
            DocumentHolder.cleanEmptyObjects,
            Document.removeRelations(this.validateRelationFields()),
            Document.removeFields(this.validateFields()),
            Document.removeFields(this.getEmptyFields())
        );

        return document;
    }


    private async fetchLatestRevision(id: string): Promise<Document> {

        try {
            return await this.datastore.get(id, { skipCache: true });
        } catch (e) {
            throw [DoceditErrors.NOT_FOUND];
        }
    }


    private validateFields(): string[] {

        const validate = (resource: Resource, projectConfiguration: ProjectConfiguration) => {
            return Validations.validateDefinedFields(resource, projectConfiguration).concat(
                Validations.validateConditionalFields(resource, projectConfiguration)
            );
        };

        return this.validateButKeepInvalidOldVersionFields(validate);
    }


    private validateRelationFields(): string[] {

        return this.validateButKeepInvalidOldVersionFields(Validations.validateDefinedRelations);
    }


    private validateButKeepInvalidOldVersionFields(validate: (_: any, __: any) => Array<string>): string[] {

        const validationResultClonedVersion = validate(this.clonedDocument.resource, this.projectConfiguration);
        const validationResultOldVersion = validate(this.oldVersion.resource, this.projectConfiguration);

        return validationResultClonedVersion.filter(isNot(includedIn(validationResultOldVersion)));
    }


    private getEmptyFields(): string[] {

        return flow(
            this.clonedDocument.resource,
            filter(and(isString, isEmpty)),
            keys);
    }


    private addScanCodeIfConfigured(document: NewDocument) {

        if (this.projectConfiguration.getCategory(document.resource.category).scanCodes?.autoCreate) {
            document.resource.scanCode = this.idGenerator.generateId();
        }
    }
 

    /**
     * @param document modified in place
     * @return the original, now modified, document
     */
    private static cleanEmptyObjects(document: Document): Document {

        for (let field of Object.keys(document.resource)) {
            if (field === Resource.RELATIONS) continue;
            if (isObject(document.resource[field]) && isEmpty(document.resource[field])) {
                delete document.resource[field];
            }
        }
        return document;
    }
}
