import {Injectable, NgZone} from "@angular/core";
import {ObjectReader} from "../services/object-reader";
import {Messages} from "idai-components-2/idai-components-2";
import {ObjectList} from "../model/objectList";
import {Datastore} from "idai-components-2/idai-components-2";
import {M} from "../m";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class Importer {

    private updatePromises: Array<Promise<any>> = [];
    
    constructor(
        private objectReader: ObjectReader,
        private messages: Messages,
        private objectList: ObjectList,
        private datastore: Datastore,
        private zone: NgZone
    ) {}

    public importResourcesFromFile(filepath): void {

        this.updatePromises = [];

        this.messages.clear();
        this.messages.add(M.IMPORTER_START);
        this.zone.run(() => {});

        var fs = require('fs');
        fs.readFile(filepath, 'utf8', function (err, data) {
            if (err) {
                this.messages.add(M.IMPORTER_FAILURE_FILEUNREADABLE, [ filepath ]);
                return;
            }

            var file = new File([ data ], '', { type: "application/json" });
            this.objectReader.fromFile(file).subscribe( doc => {
                this.updatePromises.push(this.datastore.update(doc));
            }, error => {
                this.messages.add(M.IMPORTER_FAILURE_INVALIDJSON, [ error.lineNumber ]);
                this.waitForPromiseResults();
            }, () => {
                this.waitForPromiseResults();
            });
        }.bind(this));
    }

    private waitForPromiseResults() {
        Promise.all(this.updatePromises).then(
            () => {
                this.objectList.fetchAllDocuments();
                this.showSuccessMessage();
            }, error => {
                console.log("Datastore error");
            });
    }

    private showSuccessMessage() {
        if (this.updatePromises.length == 1) {
            this.messages.add(M.IMPORTER_SUCCESS_SINGLE);
        } else {
            this.messages.add(M.IMPORTER_SUCCESS_MULTIPLE, [this.updatePromises.length.toString()]);
        }

        this.zone.run(() => {});
    }
}