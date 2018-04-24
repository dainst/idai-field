import {Document} from 'idai-components-2/core';
import {Reader} from './reader';
import {Parser} from './parser';
import {ImportStrategy} from './import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {M} from '../../m';


export interface ImportReport {

    errors: string[][],
    warnings: string[][],
    importedResourcesIds: string[]
}

type ImportDeps = {

    importStrategy: ImportStrategy,
    relationsStrategy: RelationsStrategy,
    rollbackStrategy: RollbackStrategy
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class Importer {

    /**
     * The importer uses the reader and parser, to get documents, which
     * are updated in the datastore if everything is ok.
     *
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
     */
    public go(reader: Reader,
              parser: Parser,
              importStrategy: ImportStrategy,
              relationsStrategy: RelationsStrategy,
              rollbackStrategy: RollbackStrategy): Promise<ImportReport> {

        const importDeps = {

            importStrategy: importStrategy,
            relationsStrategy: relationsStrategy,
            rollbackStrategy: rollbackStrategy
        };

        return new Promise<any>(async resolve => {

            const importReport = {
                errors: [],
                warnings: [],
                importedResourcesIds: []
            };

            try {
                const [docsToUpdate, warnings] = await Importer.parseFileContent(
                    parser, await reader.go());
                importReport.warnings = warnings as never[];

                await Importer.update(docsToUpdate, importReport, importDeps);

            } catch (msgWithParams) {

                importReport.errors.push(msgWithParams as never);
            }
            this.finishImport(importReport, importDeps, resolve);
        });
    }


    private async finishImport(
        importReport: ImportReport,
        importDeps: ImportDeps,
        resolve: Function): Promise<void> {

        if (importReport.errors.length > 0) {
            await Importer.performRollback(importReport, importDeps.rollbackStrategy);
            return resolve(importReport);
        }

        try {

            await importDeps.relationsStrategy.completeInverseRelations(importReport.importedResourcesIds);

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams);

            await importDeps.relationsStrategy.resetInverseRelations(importReport.importedResourcesIds).then(

                () => Importer.performRollback(importReport, importDeps.rollbackStrategy),
                msgWithParams => {
                    importReport.errors.push(msgWithParams);
                    return Importer.performRollback(importReport, importDeps.rollbackStrategy);
                });
        }

        resolve(importReport);
    }


    private static async parseFileContent(
        parser: Parser,
        fileContent: string): Promise<[Document[],string[][]]> {

        const docsToUpdate: Document[] = [];
        await parser
            .parse(fileContent)
            .forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));

        return [docsToUpdate, parser.getWarnings()];
    }


    private static async update(
        docsToUpdate: Document[],
        importReport: ImportReport,
        importDeps: ImportDeps): Promise<void> {

        for (let docToUpdate of docsToUpdate) {
            if (importReport.errors.length !== 0) return;

            try {
                await importDeps.importStrategy.importDoc(docToUpdate);
                importReport.importedResourcesIds.push(docToUpdate.resource.id);
            } catch (msgWithParams) {
                importReport.errors.push(msgWithParams);
            }
        }
    }


    private static async performRollback(importReport: ImportReport, rollbackStrategy: RollbackStrategy): Promise<void> {

        try {
            await rollbackStrategy.rollback(importReport.importedResourcesIds);
        } catch (err) {
            console.error(err);
            importReport.errors.push([M.IMPORT_FAILURE_ROLLBACKERROR]);
        }
    }
}