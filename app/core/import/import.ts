import {Document} from 'idai-components-2';
import {Reader} from './reader';
import {Parser} from './parser';
import {ImportStrategy} from './import-strategy';
import {RelationsStrategy} from './relations-strategy';


export interface ImportReport {

    errors: string[][],
    warnings: string[][],
    importedResourcesIds: string[]
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module Import {

    /**
     * The importer uses the reader and parser, to get documents, which
     * are updated in the datastore if everything is ok.
     *
     * Returns a promise which resolves to an importReport object with detailed information about the import,
     * containing the number of resources imported successfully as well as information on errors that occurred,
     * if any.
     */
    export function go(reader: Reader, parser: Parser,
                       importStrategy: ImportStrategy,
                       relationsStrategy: RelationsStrategy): Promise<ImportReport> {

        return new Promise<ImportReport>(async resolve => {

            const [docsToUpdate, importReport] = await parseFileContent(parser, await reader.go());
            resolve(await finishImport(
                await importStrategy.import(docsToUpdate, importReport),
                relationsStrategy));
        });
    }


    async function finishImport(importReport: ImportReport, relationsStrategy: RelationsStrategy): Promise<ImportReport> {

        if (importReport.errors.length === 0) {

            try {

                await relationsStrategy.completeInverseRelations(importReport.importedResourcesIds);

            } catch (msgWithParams) {

                importReport.errors.push(msgWithParams);
                try {
                    await relationsStrategy.resetInverseRelations(importReport.importedResourcesIds)
                } catch (e) {
                    importReport.errors.push(msgWithParams);
                }
            }
        }

        return importReport;
    }


    async function parseFileContent(parser: Parser,
                                    fileContent: string): Promise<[Array<Document>, ImportReport]> {

        const importReport = {
            errors: [],
            warnings: [],
            importedResourcesIds: []
        };

        const docsToUpdate: Document[] = [];
        try {

            await parser
                .parse(fileContent)
                .forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));

            importReport.warnings = parser.getWarnings() as never[];

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams as never);
        }
        return [docsToUpdate, importReport];
    }
}