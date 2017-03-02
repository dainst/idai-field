import {Injectable} from "@angular/core";
import {Datastore} from "idai-components-2/datastore";
import {Validator} from "idai-components-2/persist";
import {Document} from "idai-components-2/core";
import {Reader} from "./reader";
import {Parser} from "./parser";


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
@Injectable()
export class Importer {

    private inUpdateDocumentLoop:boolean;
    private docsToUpdate: Array<Document>;
    private importSuccessCounter:number;
    private objectReaderFinished:boolean;
    private currentImportWithError:boolean;
    private importReport:any;
    private resolvePromise:(any) => any;

    private initState() {
        this.docsToUpdate = [];
        this.inUpdateDocumentLoop = false;
        this.importSuccessCounter = 0;
        this.objectReaderFinished = false;
        this.currentImportWithError = false;
        this.importReport = {
            "io_error": false,
            "errors": [],
            "parser_info": [],
            "successful_imports": 0,
        };
    }

    constructor(private datastore: Datastore,
                private validator: Validator) {
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
     * @returns {Promise<any>} a promise returning the <code>importReport</code>.
     */
    public importResources(reader: Reader, parser: Parser): Promise<any> {

        return new Promise<any>(resolve => {

            this.resolvePromise = resolve;
            this.initState();

            reader.read().then(fileContent => {

                parser.parse(fileContent).subscribe(result => {

                    if (this.currentImportWithError) return;

                    for (let i in result.messages) {
                        this.importReport.parser_info.push(result.messages[i]);
                    }

                    if (!this.inUpdateDocumentLoop) {
                        this.update(result.document);
                    } else {
                        this.docsToUpdate.push(result.document);
                    }

                }, msgWithParams => {

                    this.importReport["errors"].push(msgWithParams);

                    this.objectReaderFinished = true;
                    this.currentImportWithError = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();

                }, () => {
                    this.objectReaderFinished = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();
                });
            }).catch(error => {
                this.importReport['io_error'] = true;
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
     */
    private update(doc: Document) {
        this.inUpdateDocumentLoop = true;

        this.validator.validate(doc)
            .then(
                () => {
                    return this.datastore.create(doc);
                }, msgWithParams => {
                    this.importReport['errors'].push(msgWithParams);
                    this.currentImportWithError = true;
                    this.finishImport();
                })
            .then(() => {
                this.importSuccessCounter++;

                let index = this.docsToUpdate.indexOf(doc);
                if (index > -1) this.docsToUpdate.splice(index, 1);

                if (this.docsToUpdate.length > 0) {
                    return this.update(this.docsToUpdate[0]);
                } else {
                    this.finishImport();
                }
            }, error => {
                this.importReport['errors'].push({
                    msg: error,
                    doc: doc
                });

                this.currentImportWithError = true;
                this.finishImport();
            });
    }

    private finishImport() {
        this.importReport["successful_imports"] = this.importSuccessCounter;
        this.inUpdateDocumentLoop = false;
        this.resolvePromise(this.importReport);
    }
}