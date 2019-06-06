import {ImageDocument} from 'idai-components-2';
import * as PouchDB from 'pouchdb';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {createApp, setupSyncTestDb} from './subsystem-helper';
import {Static} from '../unit/static';
import {ImageOverviewFacade} from '../../app/components/imageoverview/view/imageoverview-facade';


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled via createApp.
 *
 * @author Daniel de Oliveira
 */

describe('ImageOverviewFacade/Subsystem', () => {

    let imageOverviewFacade: ImageOverviewFacade;

    beforeEach(async done => {

        await setupSyncTestDb();
        const result = await createApp();

        const datastore: CachedDatastore<ImageDocument> = result.idaiFieldImageDocumentDatastore;
        imageOverviewFacade = result.imageOverviewFacade;

        for (let i = 0; i < 60; i++) { // create 60 documents

            const imageDocument = Static
                .ifDoc('image document ' + i, 'imagedocument' + i, 'Image', 'im' + i);
            await datastore.create(imageDocument, 'u');
        }

        await imageOverviewFacade.initialize();
        done();
    });


    afterEach(done => new PouchDB('test').destroy().then(() => { done(); }), 5000);


    it('turn page', async done => {

        let documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19); // first page's first slot is occupied by the drop area, so we have 19, not 20 documents
        expect(documents[0].resource.id).toBe('im0');

        expect(imageOverviewFacade.canTurnPage()).toBeTruthy();
        await imageOverviewFacade.turnPage();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im19');

        expect(imageOverviewFacade.canTurnPage()).toBeTruthy();
        await imageOverviewFacade.turnPage();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im38');

        expect(imageOverviewFacade.canTurnPage()).toBeTruthy();
        await imageOverviewFacade.turnPage();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toBe('im57');

        expect(imageOverviewFacade.canTurnPage()).not.toBeTruthy();
        await imageOverviewFacade.turnPage(); // will not turn again
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toBe('im57');

        expect(imageOverviewFacade.canTurnPageBack()).toBeTruthy();
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im38');

        expect(imageOverviewFacade.canTurnPageBack()).toBeTruthy();
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im19');

        expect(imageOverviewFacade.canTurnPageBack()).toBeTruthy();
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');

        expect(imageOverviewFacade.canTurnPageBack()).not.toBeTruthy();
        await imageOverviewFacade.turnPageBack(); // will not turn again
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');
        done();
    });


    it('change nrImagesPerRow', async done => {

        // we start at 5 imgs per row
        await imageOverviewFacade.turnPage(); // first img is 19
        let documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im19');

        await imageOverviewFacade.increaseNrImagesPerRow(); // 6 imgs per row
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);
        expect(documents[0].resource.id).toBe('im19');  // first item should stay first item
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents[0].resource.id).toBe('im0');

        await imageOverviewFacade.decreaseNrImagesPerRow(); // 5 imgs per row
        await imageOverviewFacade.turnPage(); // first img is 19
        await imageOverviewFacade.decreaseNrImagesPerRow(); // 4 imgs per row
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(14);
        expect(documents[0].resource.id).toBe('im19');  // again, first item should stay first item
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents[0].resource.id).toBe('im5');
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents[0].resource.id).toBe('im0');

        await imageOverviewFacade.increaseNrImagesPerRow(); // 5 imgs per row
        await imageOverviewFacade.turnPage(); // first img is 19
        await imageOverviewFacade.setNrImagesPerRow(6);
        await imageOverviewFacade.decreaseNrImagesPerRow();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);
        expect(documents[0].resource.id).toBe('im19');  // and again, first item should stay first item
        await imageOverviewFacade.turnPageBack();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents[0].resource.id).toBe('im0');
        done();
    });
});

