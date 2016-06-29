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
    private nrErrorsCurrentImport:number=0;
    private nrSuccessesCurrentImport:number=0;
    
    constructor(
        private objectReader:ObjectReader,
        private messages:Messages,
        private project: Project,
        private datastore: Datastore
    ) {}

    public importResourcesFromFile(filepath): void {
        this.nrErrorsCurrentImport=0;
        
        var fs = require('fs');
        fs.readFile(filepath, 'utf8', function (err, data) {
            if (err) return console.log(err);
            var file = new File([ data ], '', { type: "application/json" });
            this.objectReader.fromFile(file).subscribe( doc => {

                this.datastore.update(doc).then(
                    ()=>{
                        this.nrSuccessesCurrentImport=this.nrSuccessesCurrentImport+1;
                        this.prepareNotification();
                    },
                    ()=>{
                        this.nrErrorsCurrentImport=this.nrErrorsCurrentImport+1;
                        this.prepareNotification();
                    }
                );
            },()=>{
                this.nrErrorsCurrentImport=this.nrErrorsCurrentImport+1;
                this.prepareNotification();
            });
        }.bind(this));
    }

    private prepareNotification() {
        
        if (this.freeForAnotherRun) {
            setTimeout(this.notifyUser.bind(this), 800);
            this.freeForAnotherRun=false;
        }
    }

    private notifyUser() {

        this.freeForAnotherRun=true;
        
        if (this.nrSuccessesCurrentImport>0) {
            this.project.fetchAllDocuments();
            this.messages.add(M.IMPORTER_SUCCESS);
        }
        if (this.nrErrorsCurrentImport>0) {
            this.project.fetchAllDocuments();
            this.messages.add(M.IMPORTER_FAILURE);
        }
    }
}