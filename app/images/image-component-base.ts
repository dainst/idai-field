import {ActivatedRoute, Params} from '@angular/router';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Imagestore} from '../imagestore/imagestore';
import {ImageContainer} from '../imagestore/image-container';
import {BlobMaker} from '../imagestore/blob-maker';

/**
 * @author Daniel de Oliveira
 */
export class ImageComponentBase {

    protected image: ImageContainer = {};

    constructor(
        protected route: ActivatedRoute,
        protected datastore: Datastore,
        private imagestore: Imagestore,
        protected messages: Messages
    ) { }

    protected fetchDocAndImage() {
        this.getRouteParams(function(id) {
            this.id = id;
            this.datastore.get(id).then(
                doc => {
                    this.image.document = doc;
                    if (doc.resource.filename) {
                        // read original (empty if not present)
                        this.imagestore.read(doc.resource.id, false, false)
                            .then(url => this.image.imgSrc = url)
                            // read thumb
                            .then(() => this.imagestore.read(doc.resource.id, false, true))
                            .then(url => this.image.thumbSrc = url)
                            .catch(msgWithParams => {
                                this.image.imgSrc = BlobMaker.blackImg;
                                this.messages.add(msgWithParams);
                            });
                    }
                },
                () => {
                    console.error("Fatal error: could not load document for id ", id);
                });
        }.bind(this));
    }

    private getRouteParams(callback) {
        this.route.params.forEach((params: Params) => {
            callback(params['id']);
        });
    }
}