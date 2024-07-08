import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { fieldDoc } from 'idai-field-core';
import { ImageOverviewFacade } from '../../../../src/app/components/image/overview/view/imageoverview-facade';
import { cleanUp, createApp } from '../subsystem-helper';


/**
 * @author Daniel de Oliveira
 */
describe('ImageOverviewFacade/Subsystem', () => {

    let imageOverviewFacade: ImageOverviewFacade;


    beforeEach(async () => {

        const result = await createApp();

        const datastore = result.datastore;
        imageOverviewFacade = result.imageOverviewFacade;

        for (let i = 0; i < 60; i++) { // create 60 documents
            const imageDocument = fieldDoc('image document ' + i, 'imagedocument' + i, 'Image', 'im' + i);
            await datastore.create(imageDocument);
        }

        await imageOverviewFacade.initialize();
    });


    afterEach(async () =>{
        
        await cleanUp();
    });


    test('turn page', async () => {

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
    });


    test('change nrImagesPerRow -> jump back to initial page', async () => {

        await imageOverviewFacade.turnPage();
        let documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);

        await imageOverviewFacade.increaseNrImagesPerRow();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);
        expect(documents[0].resource.id).toBe('im0');

        await imageOverviewFacade.turnPage();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(24);

        await imageOverviewFacade.decreaseNrImagesPerRow();
        documents = await imageOverviewFacade.getDocuments();
        expect(documents.length).toBe(19);
        expect(documents[0].resource.id).toBe('im0');
    });
});
