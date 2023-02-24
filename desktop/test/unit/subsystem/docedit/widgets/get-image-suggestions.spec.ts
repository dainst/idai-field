import { update } from 'tsfun';
import { Datastore, Document } from 'idai-field-core';
import { getImageSuggestions } from '../../../../../src/app/components/docedit/widgets/get-image-suggestions';
import { createApp } from '../../subsystem-helper';

import PouchDB =  require('pouchdb-node');


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


    beforeEach(async done => {

        datastore = (await createApp()).datastore;
        done();
    });

    
    afterEach(done => new PouchDB('testdb').destroy().then(() => { done(); }), 5000);


    it('getImageSuggestions', async done => {

        await datastore.create(doc);

        const [,[[image], totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: 'some' } } as Document,
            'depicts',
            query
        );
        expect(image.resource.id).toBe('1');
        expect(totalCount).toBe(1);
        done();
    });


    it('exclude an already linked image from suggestions', async done => {

        await datastore.create(update(['resource', 'relations', 'depicts'], ['2'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2' } } as Document,
            'depicts',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('exclude documents from other projects', async done => {

        await datastore.create(update('project', 'other', doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: 'some' } } as Document,
            'depicts',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('georeference', async done => {

        await datastore.create(doc);

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
    });


    it('exclude if try to assign to non-project but already assigned to project document', async done => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['project'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('exclude if try to assign to project but already assigned to non-project document', async done => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['3'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { category: 'Project' , id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('exclude if try to assign to project but already assigned to project document', async done => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['project'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { category: 'Project', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('exclude if try to assign to non-project but already assigned to the document', async done => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['2'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('do not exclude if try to assign to non-project but already assigned to the document', async done => {

        await datastore.create(update(['resource', 'relations', 'isMapLayerOf'], ['3'], doc));

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2', relations: {} } } as Document,
            'layers',
            query
        );
        expect(images.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
    });
});
