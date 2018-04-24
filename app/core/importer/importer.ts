import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {Reader} from './reader';
import {Parser} from './parser';
import {ImportStrategy} from './import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {M} from '../../m';
import {DocumentDatastore} from '../datastore/document-datastore';
import {RemoteChangesStream} from '../datastore/core/remote-changes-stream';


export interface ImportReport {

    errors: string[][],
    warnings: string[][],
    importedResourcesIds: string[]
}

type ImportDeps = {

    importStrategy: ImportStrategy,
    relationsStrategy: RelationsStrategy,
    rollbackStrategy: RollbackStrategy,
    remoteChangesStream: RemoteChangesStream
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
    private importReport: ImportReport;

    private initState() {

        this.docsToUpdate = [];
        this.inUpdateDocumentLoop = false;
        this.objectReaderFinished = false;

        this.importReport = {
            errors: [],
            warnings: [],
            importedResourcesIds: []
        };
    }


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
                           rollbackStrategy: RollbackStrategy, datastore: DocumentDatastore,
                           remoteChangesStream: RemoteChangesStream): Promise<ImportReport> {

        const importDeps: ImportDeps = {

            importStrategy: importStrategy,
            relationsStrategy: relationsStrategy,
            rollbackStrategy: rollbackStrategy,
            remoteChangesStream: remoteChangesStream
        };


        return new Promise<any>(async resolve => {

            this.initState();

            remoteChangesStream.setAutoCacheUpdate(false);

            try {
                const fileContent = await reader.go();
                await this.parseFileContent(parser, fileContent, importDeps, resolve);
            } catch (msgWithParams) {
                this.importReport.errors.push(msgWithParams);
                await this.finishImport(importDeps, resolve);
            }
        });
    }


    private async parseFileContent(
        parser: Parser,
        fileContent: string,
        importDeps: ImportDeps,
        resolve: Function) {

        await parser.parse(fileContent).subscribe(resultDocument => {

            if (this.importReport.errors.length > 0) return;

            if (!this.inUpdateDocumentLoop) this.update(resultDocument, importDeps, resolve);
            else this.docsToUpdate.push(resultDocument);

        }, msgWithParams => {
            this.importReport.errors.push(msgWithParams);

            this.objectReaderFinished = true;
            if (!this.inUpdateDocumentLoop) this.finishImport(importDeps, resolve);

        }, () => {
            this.importReport.warnings = parser.getWarnings();
            this.objectReaderFinished = true;
            if (!this.inUpdateDocumentLoop) this.finishImport(importDeps, resolve);
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
    private async update(
        doc: Document,
        importDeps: ImportDeps,
        resolve: Function) {

        this.inUpdateDocumentLoop = true;

        await importDeps.importStrategy.importDoc(doc)

            .then(() => {

                this.importReport.importedResourcesIds.push(doc.resource.id);

                let index = this.docsToUpdate.indexOf(doc);
                if (index > -1) this.docsToUpdate.splice(index, 1);

                if (this.docsToUpdate.length > 0) {

                    return this.update(this.docsToUpdate[0], importDeps, resolve);

                } else {
                    this.finishImport(importDeps, resolve);
                }

            }, msgWithParams => {

                this.importReport.errors.push(msgWithParams);
                return this.finishImport(importDeps, resolve);
            });
    }


    private async finishImport(importDeps: ImportDeps, resolve: Function): Promise<void> {

        this.inUpdateDocumentLoop = false;

        if (this.importReport.errors.length > 0) {
            await this.performRollback(importDeps.rollbackStrategy);
            importDeps.remoteChangesStream.setAutoCacheUpdate(true);
            return resolve(this.importReport);
        }

        try {

            await importDeps.relationsStrategy.completeInverseRelations(this.importReport.importedResourcesIds);

        } catch (msgWithParams) {
            this.importReport.errors.push(msgWithParams);

            await importDeps.relationsStrategy.resetInverseRelations(this.importReport.importedResourcesIds).then(

                () => this.performRollback(importDeps.rollbackStrategy),
                msgWithParams => {
                    this.importReport.errors.push(msgWithParams);
                    return this.performRollback(importDeps.rollbackStrategy);
                });
        }

        importDeps.remoteChangesStream.setAutoCacheUpdate(true);
        resolve(this.importReport);
    }


    private async performRollback(rollbackStrategy: RollbackStrategy): Promise<void> {

        try {
            await rollbackStrategy.rollback(this.importReport.importedResourcesIds);
        } catch (err) {
            console.error(err);
            this.importReport.errors.push([M.IMPORT_FAILURE_ROLLBACKERROR]);
        }
    }
}