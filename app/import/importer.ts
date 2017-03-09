import {Injectable} from "@angular/core";
import {Document} from "idai-components-2/core";
import {Reader} from "./reader";
import {Parser} from "./parser";
import {ImportStrategy} from "./import-strategy";


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
    private resolvePromise: (any) => any;

    private initState() {
        this.docsToUpdate = [];
        this.inUpdateDocumentLoop = false;
        this.objectReaderFinished = false;
        this.currentImportWithError = false;
        this.importReport = {
            errors: [],
            warnings: [],
            importedResourcesIds: [],
        };
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
    public importResources(reader: Reader, parser: Parser, importStrategy: ImportStrategy): Promise<ImportReport> {

        return new Promise<any>(resolve => {

            this.resolvePromise = resolve;
            this.initState();

            reader.go().then(fileContent => {

                parser.parse(fileContent).subscribe(resultDocument => {

                    if (this.currentImportWithError) return;

                    if (!this.inUpdateDocumentLoop) this.update(resultDocument, importStrategy);
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
    private update(doc: Document, importStrategy: ImportStrategy) {
        this.inUpdateDocumentLoop = true;

        importStrategy.importDoc(doc)
            .then(() => {

                this.importReport.importedResourcesIds.push(doc.resource.id);

                let index = this.docsToUpdate.indexOf(doc);
                if (index > -1) this.docsToUpdate.splice(index, 1);

                if (this.docsToUpdate.length > 0) {
                    return this.update(this.docsToUpdate[0], importStrategy);
                } else {
                    this.finishImport();
                }
            }, msgWithParams => {
                this.importReport.errors.push(msgWithParams);
                this.currentImportWithError = true;
                this.finishImport();
            });
    }

    private finishImport() {
        this.inUpdateDocumentLoop = false;
        this.resolvePromise(this.importReport);
    }
}