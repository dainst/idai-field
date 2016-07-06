import {Injectable} from "@angular/core";
import {ObjectReader} from "../services/object-reader";
import {Messages, Datastore, Utils} from "idai-components-2/idai-components-2";
import {Observable} from "rxjs/Observable";
import {ObjectList} from "../model/objectList";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {ValidationInterceptor} from "../services/validation-interceptor";
import {M} from "../m";



/**
 * The Importer's main responsibility is to read resources from jsonl files
 * residing on the local file system and to convert them to documents, which
 * are created or updated in the datastore in case of success.
 *
 * The importer also feeds Messages with messages about the outcome of the operation.
 * This is normally done in a component, but since the Importer is only reachable
 * via the menu it is done here instead.
 * 
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class Importer {

    private inUpdateDocumentLoop: boolean;
    private docsToUpdate: Array<IdaiFieldDocument>;
    private importSuccessCounter: number;
    private objectReaderFinished: boolean;
    private currentImportWithError: boolean;
    private observers = [];
    private importReport;
    
    private initState() {
        this.docsToUpdate = [];
        this.inUpdateDocumentLoop = false;
        this.importSuccessCounter = 0;
        this.objectReaderFinished = false;
        this.currentImportWithError = false;
        this.importReport = { "invalid_json" : [], "successful_imports" : 0 };
    }
    
    constructor(
        private objectReader: ObjectReader,
        private objectList: ObjectList,
        private datastore: Datastore,
        private validationInterceptor: ValidationInterceptor,


        // TODO remove dependency
        private messages: Messages
    ) {}

    /**
     * There are three common errors which can occur:
     * 1. Error during updating the datastore which can also happen due to constraint violations detected there.
     * 2. Error reading the json line.
     * 3. Error validating the document.
     *
     * @param filepath
     */
    public importResourcesFromFile(filepath: string): Observable<any> {

        return Observable.create( observer => {
            this.observers.push(observer);

            this.initState();

            var fs = require('fs');
            fs.readFile(filepath, 'utf8', function (err, data) {
                if (err) {
                    this.messages.add(M.IMPORTER_FAILURE_FILEUNREADABLE, [filepath]);
                    return;
                }

                var file = new File([data], '', {type: "application/json"});
                this.objectReader.fromFile(file).subscribe(doc => {
                    if (this.currentImportWithError) return;

                    if (!this.inUpdateDocumentLoop) {
                        this.update(doc);
                    } else {
                        this.docsToUpdate.push(doc);
                    }

                }, error => {

                    this.importReport["invalid_json"].push(error.lineNumber);

                    this.objectReaderFinished = true;
                    this.currentImportWithError = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();
                }, () => {
                    this.objectReaderFinished = true;
                    if (!this.inUpdateDocumentLoop) this.finishImport();
                });
            }.bind(this));
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

        var error = this.validationInterceptor.validate(doc);
        if (error) {
            this.showValidationErrorMessage(doc, error);
            this.currentImportWithError = true;
            this.finishImport();
            return;
        }

        this.inUpdateDocumentLoop=true;
        this.datastore.update(doc).then(() => {
            this.importSuccessCounter++;

            if (this.docsToUpdate.length>0) {
                this.update(this.docsToUpdate[0]);
            } else {
                this.finishImport();
                this.inUpdateDocumentLoop=false;
                return;
            }

        }, error => {
            this.showDatastoreErrorMessage(doc, error);
            this.currentImportWithError = true;
            this.finishImport();
            this.inUpdateDocumentLoop=false;
        });
    }

    private finishImport() {

        if (this.importSuccessCounter > 0 ) {
            this.objectList.fetchAllDocuments();
        }

        this.importReport["successful_imports"]=this.importSuccessCounter;
        for (var obs of this.observers) {
            obs.next(this.importReport);
        }

    }

    private showDatastoreErrorMessage(doc: IdaiFieldDocument, error: any) {
        
        if (error == M.OBJLIST_IDEXISTS) {
            this.messages.add(M.IMPORTER_FAILURE_IDEXISTS, [doc.resource.identifier]);
        } else {
            this.messages.add(M.IMPORTER_FAILURE_GENERICDATASTOREERROR, [doc.resource.identifier]);
        }
    }

    private showValidationErrorMessage(doc: IdaiFieldDocument, error: any) {

        if (error == M.OBJLIST_IDMISSING) {
            this.messages.add(M.IMPORTER_FAILURE_IDMISSING);
        } else if (error == M.VALIDATION_ERROR_INVALIDTYPE) {
            this.messages.add(M.IMPORTER_FAILURE_INVALIDTYPE,
                [Utils.getTypeFromId(doc.resource['@id']), doc.resource.identifier]);
        } else if (error == M.VALIDATION_ERROR_INVALIDFIELD) {
            this.messages.add(M.IMPORTER_FAILURE_INVALIDFIELD, [doc.resource.identifier]);
        }
    }
}