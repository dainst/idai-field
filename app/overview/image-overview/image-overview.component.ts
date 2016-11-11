import {Component, OnInit, Inject, Input} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {OverviewComponent} from '../overview.component';
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IndexeddbDatastore} from "../../datastore/indexeddb-datastore";
import {Mediastore} from '../../datastore/mediastore'
import {Query} from "idai-components-2/idai-components-2"

@Component({

    moduleId: module.id,
    templateUrl: './image-overview.html'
})

/**
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent extends OverviewComponent implements OnInit {

    constructor(@Inject('app.config') private config,
                private router: Router,
                private route: ActivatedRoute,
                datastore: IndexeddbDatastore,
                private mediastore: Mediastore
    ) {
        super(datastore);
    }

    public onSelectImages(event) {
        var files = event.srcElement.files;
        if (files && files.length > 0) {
            for (var i=0; i < files.length; i++) this.uploadFile(files[i]);
        }
    }

    private uploadFile(file) {
        var reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                that.mediastore.create(file.name, reader.result).then(() => {
                    console.log("upload finished ", file);
                    return that.createImageDocument(file);
                }).then(() => {
                    console.log("created image document for " + file.name);
                    that.fetchDocuments2(that.query);
                });
            }
        })(this);
        reader.readAsArrayBuffer(file);
    }

    private createImageDocument(file): Promise<any> {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                var doc = {
                    "resource": {
                        "identifier": file.name,
                        "type": "image",
                        "filename": file.name,
                        "width": img.width,
                        "height": img.height
                    }
                };
                this.datastore.create(doc).then(result => resolve(result));
            };
        });
    }
    
    protected setUpDefaultFilters() {

        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments2(query: Query) {
        
        this.datastore.find(query).then(documents => {
            this.documents = documents;
            console.log("set documents",this.documents)
        }).catch(err => console.error(err));
    }

    public ngOnInit() {

        this.fetchDocuments2(this.query);

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.datastore.get(params['id']).then(document => { this.setSelected(document) });
            }
        });
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        this.router.navigate(['images', { id: documentToSelect.resource.id }]);
    }
}
