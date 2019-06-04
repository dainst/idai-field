import {FieldDocument, ImageDocument} from 'idai-components-2';
import * as PouchDB from 'pouchdb';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {ResourcesStateManager} from '../../app/components/resources/view/resources-state-manager';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {createApp, setupSyncTestDb} from './subsystem-helper';
import {Static} from '../unit/static';
import {TabManager} from '../../app/components/tab-manager';
import {ImageOverviewFacade} from '../../app/components/imageoverview/view/imageoverview-facade';


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ViewFacade/Subsystem', () => {

    let imageOverviewFacade: ImageOverviewFacade;

    beforeEach(async done => {

        await setupSyncTestDb();
        const result = await createApp();

        const datastore: CachedDatastore<ImageDocument> = result.idaiFieldImageDocumentDatastore; // TODO rename datastore
        imageOverviewFacade = result.imageOverviewFacade;

        for (let i = 0; i < 20; i++) {

            const imageDocument = Static
                .ifDoc('image document ' + i, 'imagedocument' + i, 'Image', 'im' + i);
            await datastore.create(imageDocument, 'u');
        }

        await imageOverviewFacade.initialize();
        done();
    });


    afterEach(done => new PouchDB('test').destroy().then(() => { done(); }), 5000);


    it('reload view states on startup', async done => {

        await imageOverviewFacade.setQueryString('');
        const documents = await imageOverviewFacade.getDocuments();
        expect(documents[0].resource.id).toBe('im0');
        done();
    });
});

