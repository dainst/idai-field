import {Injectable} from "@angular/core";
import {Datastore} from "idai-components-2/idai-components-2";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Validator} from "../model/validator";
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
    private docsToUpdate: Array<IdaiFieldDocument>;
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
            "parser_errors": [],
            "successful_imports": 0,
            "validation_errors": [],
            "datastore_errors": []
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

            console.log("importing resources");

            this.resolvePromise = resolve;
            this.initState();

            reader.read().then(fileContent => {

                console.log("read file content");

                parser.parse(fileContent).subscribe(doc => {

                    // console.debug("read document", doc);

                    if (this.currentImportWithError) return;

                    if (!this.inUpdateDocumentLoop) {
                        this.update(doc);
                    } else {
                        this.docsToUpdate.push(doc);
                    }

                }, error => {
                    this.importReport["parser_errors"].push(error);

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
    private update(doc: IdaiFieldDocument) {

        var index = this.docsToUpdate.indexOf(doc);
        if (index > -1) this.docsToUpdate.splice(index, 1);

        var validationReport = this.validator.validate(doc);
        if (!validationReport.valid) {
            this.importReport['validation_errors'].push({
                doc: doc,
                msg: validationReport.errorMessage,
                msgParams: validationReport.errorData
            });

            this.currentImportWithError = true;
            this.finishImport();
            return;
        }
        
        this.inUpdateDocumentLoop = true;
        this.datastore.update(doc).then(() => {
            this.importSuccessCounter++;
            // console.log("successfully imported document", doc);

            if (this.docsToUpdate.length > 0) {
                this.update(this.docsToUpdate[0]);
            } else {
                this.finishImport();
                this.inUpdateDocumentLoop = false;
                return;
            }

        }, error => {

            this.importReport['datastore_errors'].push({
                doc: doc,
                msg: error
            });

            this.currentImportWithError = true;
            this.finishImport();
            this.inUpdateDocumentLoop = false;
        });
    }

    private finishImport() {
        console.debug("finished import");
        this.importReport["successful_imports"] = this.importSuccessCounter;
        this.resolvePromise(this.importReport);
    }
}