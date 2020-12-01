import {FieldDocument} from 'idai-components-2';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {ImageRelationsManager} from '../../../model/image-relations-manager';


// TODO manually test once (via ui)
// TODO inline into image-overview-taskbar.component
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PersistenceHelper {

    constructor(
        private imageOverviewFacade: ImageOverviewFacade,
        private imageRelationsManager: ImageRelationsManager
    ) {}


    public async deleteSelectedImageDocuments() {

        await this.imageRelationsManager.deleteSelectedImageDocuments(this.imageOverviewFacade.getSelected());

        for (let document of this.imageOverviewFacade.getSelected()) {
            this.imageOverviewFacade.remove(document);
        }
    }


    public async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument) {

        await this.imageRelationsManager
            .addDepictsRelationsToSelectedDocuments(targetDocument, this.imageOverviewFacade.getSelected());
    }


    public async removeDepictsRelationsOnSelectedDocuments() {

        await this.imageRelationsManager
            .removeDepictsRelationsOnSelectedDocuments(this.imageOverviewFacade.getSelected());
    }
}
