import {ActivatedRoute, Params} from "@angular/router";
import {ReadDatastore} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
export class ImageBase {

    protected doc;

    constructor(
        private route: ActivatedRoute,
        private datastore: ReadDatastore
    ) { }

    protected fetchDoc() {
        this.getRouteParams(function(id){
            this.id=id;
            this.datastore.get(id).then(
                doc=>{
                    this.doc = doc;
                },
                err=>{
                    console.error("Fatal error: could not load document for id ",id);
                });
        }.bind(this));
    }

    private getRouteParams(callback) {
        this.route.params.forEach((params: Params) => {
            callback(params['id']);
        });
    }
}
