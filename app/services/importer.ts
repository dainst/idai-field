import {Injectable} from "@angular/core";
import {ObjectReader} from "../services/object-reader";
import {Messages} from "idai-components-2/idai-components-2";
import {Project} from "../model/project";
import {Datastore} from "idai-components-2/idai-components-2";
import {M} from "../m";


/**
 */
@Injectable()
export class Importer {

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
                console.log("obj: ", doc);
                this.datastore.update(doc).then(
                    ()=>{
                        this.project.fetchAllDocuments();
                        this.messages.add("hallo");
                    },
                    err=>console.error(err)
                );
            });
        }.bind(this));
    }

    // setTimeout(this.notifyUser.bind(this), 100);
    //
    // private notifyUser() {
    //
    //     if (this.updateSuggestionsMode) return;
    //     this.updateSuggestionsMode=true;
    //
    //     if (this.idSearchString.length < 1) return;
    //
    //     this.clearSuggestions();
    //     this.datastore.find(this.idSearchString)
    //         .then(documents => {
    //
    //             this.makeSuggestionsFrom(documents);
    //             this.updateSuggestionsMode=false;
    //
    //         }).catch(err => {
    //             console.debug(err);
    //             this.updateSuggestionsMode=false;
    //         }
    //     );
    // }
    //
}