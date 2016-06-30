import {Injectable} from "@angular/core";
import {ObjectReader} from "../services/object-reader";
import {Messages} from "idai-components-2/idai-components-2";
import {Project} from "../model/project";
import {Datastore} from "idai-components-2/idai-components-2";
import {M} from "../m";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class Importer {

    private userNotificationInPreparation = false;
    private nrErrorsCurrentImport: number = 0;
    private nrSuccessesCurrentImport: number = 0;
    
    constructor(
        private objectReader: ObjectReader,
        private messages: Messages,
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
                        this.nrSuccessesCurrentImport++;
                        this.prepareNotification();
                    },
                    ()=>{
                        this.nrErrorsCurrentImport++;
                        this.prepareNotification();
                    }
                );
            },()=>{
                this.nrErrorsCurrentImport++;
                this.prepareNotification();
            });
        }.bind(this));
    }

    private prepareNotification() {
        
        if (!this.userNotificationInPreparation) {
            setTimeout(this.notifyUser.bind(this), 800);
            this.userNotificationInPreparation = true;
        }
    }

    private notifyUser() {

        this.userNotificationInPreparation = false;
        
        if (this.nrSuccessesCurrentImport > 0) {
            this.project.fetchAllDocuments();
            if (this.nrSuccessesCurrentImport == 1) {
                this.messages.add(M.IMPORTER_SUCCESS_SINGLE);
            } else {
                this.messages.add(M.IMPORTER_SUCCESS_MULTIPLE, [this.nrSuccessesCurrentImport.toString()]);
            }
            this.nrSuccessesCurrentImport = 0;
        }

        if (this.nrErrorsCurrentImport > 0) {
            this.project.fetchAllDocuments();
            if (this.nrErrorsCurrentImport == 1) {
                this.messages.add(M.IMPORTER_FAILURE_SINGLE);
            } else {
                this.messages.add(M.IMPORTER_FAILURE_MULTIPLE, [this.nrErrorsCurrentImport.toString()]);   
            }
            this.nrErrorsCurrentImport = 0;
        }
    }
}