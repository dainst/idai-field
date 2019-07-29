import {ImageDocument} from 'idai-components-2';
import * as PouchDB from 'pouchdb';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {createApp, setupSyncTestDb} from './subsystem-helper';
import {Static} from '../unit/static';
import {MediaOverviewFacade} from '../../app/components/mediaoverview/view/media-overview-facade';


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled via createApp.
 *
 * @author Daniel de Oliveira
 */

describe('MediaOverviewFacade/Subsystem', () => {

    let mediaOverviewFacade: MediaOverviewFacade;

    beforeEach(async done => {

        await setupSyncTestDb();
        const result = await createApp();

        const datastore: CachedDatastore<ImageDocument> = result.imageDatastore;
        mediaOverviewFacade = result.mediaOverviewFacade;

        for (let i = 0; i < 60; i++) { // create 60 documents

            const imageDocument = Static
                .ifDoc('image document ' + i, 'imagedocument' + i, 'Image', 'im' + i);
            await datastore.create(imageDocument, 'u');
        }

        await mediaOverviewFacade.initialize();
        done();
    });


    afterEach(done => new PouchDB('test').destroy().then(() => { done(); }), 5000);


    it('turn page', async done => {

        let documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19); // first page's first slot is occupied by the drop area, so we have 19, not 20 documents
        expect(documents[0].resource.id).toBe('im0');

        expect(mediaOverviewFacade.canTurnPage()).toBeTruthy();
        await mediaOverviewFacade.turnPage();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im19');

        expect(mediaOverviewFacade.canTurnPage()).toBeTruthy();
        await mediaOverviewFacade.turnPage();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im38');

        expect(mediaOverviewFacade.canTurnPage()).toBeTruthy();
        await mediaOverviewFacade.turnPage();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toBe('im57');

        expect(mediaOverviewFacade.canTurnPage()).not.toBeTruthy();
        await mediaOverviewFacade.turnPage(); // will not turn again
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toBe('im57');

        expect(mediaOverviewFacade.canTurnPageBack()).toBeTruthy();
        await mediaOverviewFacade.turnPageBack();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im38');

        expect(mediaOverviewFacade.canTurnPageBack()).toBeTruthy();
        await mediaOverviewFacade.turnPageBack();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im19');

        expect(mediaOverviewFacade.canTurnPageBack()).toBeTruthy();
        await mediaOverviewFacade.turnPageBack();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');

        expect(mediaOverviewFacade.canTurnPageBack()).not.toBeTruthy();
        await mediaOverviewFacade.turnPageBack(); // will not turn again
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');
        done();
    });


    it('change nrImagesPerRow -> jump back to initial page', async done => {

        await mediaOverviewFacade.turnPage();
        let documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);

        await mediaOverviewFacade.increaseNrMediaResourcesPerRow();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);
        expect(documents[0].resource.id).toBe('im0');

        await mediaOverviewFacade.turnPage();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);

        await mediaOverviewFacade.decreaseNrMediaResourcesPerRow();
        documents = await mediaOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');
        done();
    });
});

