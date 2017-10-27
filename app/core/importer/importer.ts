import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {Reader} from './reader';
import {Parser} from './parser';
import {ImportStrategy} from './import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {CachedDatastore} from '../datastore/cached-datastore';
import {M} from '../../m';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';


export interface ImportReport {

    errors: string[][],
    warnings: string[][],
    importedResourcesIds: string[]
}


@Injectable()
/**
 * The Importer's responsibility is to read resources from jsonl files
 * residing on the local file system and to convert them to documents, which
 * are created or updated in the datastore in case of success.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class Importer {

    private inUpdateDocumentLoop: boolean;
    private docsToUpdate: Array<Document>;
    private objectReaderFinished: boolean;
    private currentImportWithError: boolean;
    private importReport: ImportReport;
    private resolvePromise: (any: any) => any;

    private importStrategy: ImportStrategy;
    private relationsStrategy: RelationsStrategy;
    private rollbackStrategy: RollbackStrategy;

    private datastore: IdaiFieldDatastore;


    private initState(importStrategy: ImportStrategy, relationsStrategy: RelationsStrategy,
                      rollbackStrategy: RollbackStrategy) {

        this.docsToUpdate = [];
        this.inUpdateDocumentLoop = false;
        this.objectReaderFinished = false;
        this.currentImportWithError = false;

        this.importReport = {
            errors: [],
            warnings: [],
            importedResourcesIds: []
        };

        this.importStrategy = importStrategy;
        this.relationsStrategy = relationsStrategy;
        this.rollbackStrategy = rollbackStrategy;
    }

    constructor() { }

    /**
     * Returns a promise which resolves to an importReport object with detailed information about the import,
     * containing the number of resources imported successfully as well as information on errors that occurred,
     * if any.
     *
     * There are four common errors which can occur:
     *
     * 1. Error during updating the datastore which can also happen due to constraint violations detected there.
     * 2. Error reading a json line.
     * 3. Error validating a resource.
     * 4. The file is unreadable.
     *
     * @param reader
     * @param parser
     * @param importStrategy
     * @returns {Promise<any>} a promise returning the <code>importReport</code>.
     */
    public importResources(reader: Reader, parser: Parser, importStrategy: ImportStrategy,
                           relationsStrategy: RelationsStrategy,
                           rollbackStrategy: RollbackStrategy, datastore: IdaiFieldDatastore): Promise<ImportReport> {

        return new Promise<any>(resolve => {

            this.resolvePromise = resolve;
            this.initState(importStrategy, relationsStrategy, rollbackStrategy);

            this.datastore = datastore;
            this.datastore.setAutoCacheUpdate(false);

            reader.go().then(fileContent => {

                parser.parse(fileContent).subscribe(resultDocument => {

                    if (this.currentImportWithError) return;

                    if (!this.inUpdateDocumentLoop) this.update(resultDocument);
                    else this.docsToUpdate.push(resultDocument);

                }, msgWithParams => {
                    this.importReport.errors.push(msgWithParams);

                    this.objectReaderFinished = true;
                    this.currentImportWithError = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();

                }, () => {
                    this.importReport.warnings = parser.getWarnings();
                    this.objectReaderFinished = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();
                });
            }).catch(msgWithParams => { // TODO test this
                this.importReport.errors.push(msgWithParams);
                this.finishImport();
            });
        });
    }

    /**
     * Calls itself recursively as long as <code>docsToUpdate</code>
     * is not empty.
     *
     * Triggers a datastore update of <code>doc</code> on every call.
     *
     * @param doc
     * @param importStrategy
     */
    private update(doc: Document) {

        this.inUpdateDocumentLoop = true;

        this.importStrategy.importDoc(doc)
            .then(() => {

                this.importReport.importedResourcesIds.push(doc.resource.id as any);

                let index = this.docsToUpdate.indexOf(doc);
                if (index > -1) this.docsToUpdate.splice(index, 1);

                if (this.docsToUpdate.length > 0) {
                    return this.update(this.docsToUpdate[0]);
                } else {
                    this.finishImport();
                }
            }, msgWithParams => {
                this.importReport.errors.push(msgWithParams);
                this.currentImportWithError = true;
                this.finishImport();
            });
    }

    private finishImport(): Promise<any> {

        this.inUpdateDocumentLoop = false;

        if (this.importReport.errors.length > 0) {
            return this.performRollback().then(
                () => { this.datastore.setAutoCacheUpdate(true); }
            );
        } else {
            return this.relationsStrategy.completeInverseRelations(this.importReport.importedResourcesIds).then(
                () => {
                    this.datastore.setAutoCacheUpdate(true);
                    this.resolvePromise(this.importReport);
                }, msgWithParams => {
                    this.importReport.errors.push(msgWithParams);
                    return this.relationsStrategy.resetInverseRelations(this.importReport.importedResourcesIds).then(
                        () => {
                            return this.performRollback().then(
                                () => { this.datastore.setAutoCacheUpdate(true); }
                            );
                        }, msgWithParams => {
                            this.importReport.errors.push(msgWithParams);
                            return this.performRollback().then(
                                () => { this.datastore.setAutoCacheUpdate(true); }
                            );
                        });
                }
            )
        }
    }

    private performRollback(): Promise<any> {

        return this.rollbackStrategy.rollback(this.importReport.importedResourcesIds).then(
            () => {
                this.resolvePromise(this.importReport);
            }, err => {
                console.error(err);
                this.importReport.errors.push([M.IMPORT_FAILURE_ROLLBACKERROR]);
                this.resolvePromise(this.importReport);
            }
        );
    }

}