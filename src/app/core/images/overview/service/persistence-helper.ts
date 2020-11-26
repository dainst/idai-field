import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {RelationsManager} from '../../../model/relations-manager';
import {clone} from '../../../util/object-util';
import {Imagestore} from '../../imagestore/imagestore';
import {PersistenceHelperErrors} from './persistence-helper-errors';
import {SettingsProvider} from '../../../settings/settings-provider';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PersistenceHelper {

    constructor(
        private imageOverviewFacade: ImageOverviewFacade,
        private relationsManager: RelationsManager,
        private imagestore: Imagestore
    ) {}


    /**
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE]
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_DELETE]
     */
    public async deleteSelectedImageDocuments() {

        if (!this.imagestore.getPath()) throw [PersistenceHelperErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE];

        for (let document of this.imageOverviewFacade.getSelected()) {
            if (!document.resource.id) continue;
            const resourceId: string = document.resource.id;

            try {
                await this.imagestore.remove(resourceId);
            } catch (err) {
                throw [PersistenceHelperErrors.IMAGESTORE_ERROR_DELETE, document.resource.identifier];
            }

            await this.relationsManager.remove(document);
            this.imageOverviewFacade.remove(document);
        }
    }


    public async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument) {

        for (let imageDocument of this.imageOverviewFacade.getSelected()) {
            const oldVersion: ImageDocument = clone(imageDocument);
            const depictsRelations: string[] = imageDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.relationsManager.persist(
                imageDocument, oldVersion
            );
        }
    }


    public async removeDepictsRelationsOnSelectedDocuments() {

        for (let document of this.imageOverviewFacade.getSelected()) {
            const oldVersion: ImageDocument = clone(document);
            document.resource.relations.depicts = [];

            await this.relationsManager.persist(
                document, oldVersion
            );
        }
    }
}
