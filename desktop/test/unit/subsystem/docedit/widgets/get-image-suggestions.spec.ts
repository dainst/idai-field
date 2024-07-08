import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { update } from 'tsfun';
import { Datastore, Document } from 'idai-field-core';
import { getImageSuggestions } from '../../../../../src/app/components/docedit/widgets/get-image-suggestions';
import { cleanUp, createApp } from '../../subsystem-helper';


describe('subsystem/getImageSuggestions', () => {

    let datastore: Datastore;

    const doc = {
        resource: { id: '1', identifier: 'One', category: 'Image', relations: {}, georeference: true },
        project: undefined
    };

    const query = {
        q: '',
        categories: ['Image'],
        offset: 0,
        limit: 1
    };


    beforeEach(async () => {

        datastore = (await createApp()).datastore;
    });

    
    afterEach(async () =>{
        
        await cleanUp();
    });


    test('getImageSuggestions', async () => {

        await datastore.create(doc);

        const [, [[image], totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: 'some' } } as Document,
            'depicts',
            query
        );
        expect(image.resource.id).toBe('1');
        expect(totalCount).toBe(1);
    });


    test('exclude an already linked image from suggestions', async () => {

        await datastore.create(update(['resource', 'relations', 'depicts'], ['2'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2' } } as Document,
            'depicts',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('exclude documents from other projects', async () => {

        await datastore.create(update('project', 'other', doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: 'some' } } as Document,
            'depicts',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('georeference', async () => {

        await datastore.create(doc);

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(1);
        expect(totalCount).toBe(1);
    });


    test('exclude if try to assign to non-project but already assigned to project document', async () => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['project'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('exclude if try to assign to project but already assigned to non-project document', async () => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['3'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { category: 'Project' , id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('exclude if try to assign to project but already assigned to project document', async () => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['project'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { category: 'Project', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('exclude if try to assign to non-project but already assigned to the document', async () => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['2'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    test('do not exclude if try to assign to non-project but already assigned to the document', async () => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['3'], doc));

        const [, [images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(1);
        expect(totalCount).toBe(1);
    });
});
