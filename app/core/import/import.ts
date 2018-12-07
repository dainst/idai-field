import {Document} from 'idai-components-2';
import {Parser} from './parser';
import {ImportStrategy} from './import-strategy';


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
    export async function go(fileContent: string, parser: Parser, importStrategy: ImportStrategy): Promise<ImportReport> {

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

        return await importStrategy.import(docsToUpdate, importReport);
    }
}