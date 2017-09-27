import {ActivatedRoute, Params} from '@angular/router';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Imagestore} from '../imagestore/imagestore';
import {ImageContainer} from '../imagestore/image-container';
import {BlobMaker} from '../imagestore/blob-maker';
import {M} from '../m';

/**
 * @author Daniel de Oliveira
 */
export class ImageComponentBase {

    protected image: ImageContainer = {};
    protected activeTab: string;

    constructor(
        protected route: ActivatedRoute,
        protected datastore: Datastore,
        private imagestore: Imagestore,
        protected messages: Messages
    ) { }

    protected fetchDocAndImage() {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

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
                            .catch(() => {
                                this.image.imgSrc = BlobMaker.blackImg;
                                this.messages.add([M.IMAGES_ONE_NOT_FOUND]);
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
            this.activeTab = params['tab'];
            callback(params['id']);
        });
    }
}