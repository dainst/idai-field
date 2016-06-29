import {Injectable} from "@angular/core";
import {ObjectReader} from "../services/object-reader";
import {Messages} from "idai-components-2/idai-components-2";
import {Project} from "../model/project";
import {Datastore} from "idai-components-2/idai-components-2";
import {M} from "../m";


/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class Importer {

    private freeForAnotherRun=true;

    constructor(
        private objectReader:ObjectReader,
        private messages:Messages,
        private project: Project,
        private datastore: Datastore
    ) {}

    public importResourcesFromFile(filepath): void {

        var fs = require('fs');
        fs.readFile(filepath, 'utf8', function (err, data) {
            if (err) return console.log(err);
            var file = new File([ data ], '', { type: "application/json" });
            this.objectReader.fromFile(file).subscribe( doc => {

                this.datastore.update(doc).then(
                    ()=>{
                        this.prepareNotification();
                    },
                    err=>{
                        console.error(err)
                    }
                );
            });
        }.bind(this));
    }

    private prepareNotification() {
        if (this.freeForAnotherRun) {
            setTimeout(this.notifyUser.bind(this), 800);
            this.freeForAnotherRun=false;
        }
    }

    /**
     * Informs the user about the state of the import.
     */
    private notifyUser() {

        this.freeForAnotherRun=true;


        this.project.fetchAllDocuments();
        this.messages.add(M.IMPORTER_SUCCESS);
        console.log("finish");


    }
}