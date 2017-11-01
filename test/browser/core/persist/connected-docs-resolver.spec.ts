import {ProjectConfiguration} from 'idai-components-2/configuration';
import {ConnectedDocsResolver} from "../../../../app/core/persist/connected-docs-resolver";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ConnectedDocsResolver', () => {


        const projectConfiguration = new ProjectConfiguration({
            'types': [
                {
                    'type': 'object',
                    'fields': []
                }
            ],
            'relations': [
                {
                    'name': 'BelongsTo',
                    'inverse': 'Contains',
                    'label': 'Enthalten in'
                },
                {
                    'name': 'Contains',
                    'inverse': 'BelongsTo',
                    'label': 'Enthält'
                },
                {
                    'name': 'OneWay',
                    'inverse': 'NO-INVERSE',
                    'label': 'Einweg'
                }
            ]
        });


        let doc;
        let relatedDoc;
        let anotherRelatedDoc;
        let connectedDocsResolver;


        beforeEach(() => {

            doc = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'type': 'object',
                'relations' : {}
            }};
            relatedDoc = { 'resource' : {
                'id': '2' , 'identifier': 'ob2',
                'type': 'object',
                'relations' : {}
            }};
            anotherRelatedDoc = { 'resource' : {
                'id': '3' , 'identifier': 'ob3',
                'type': 'object',
                'relations' : {}
            }};
            connectedDocsResolver = new ConnectedDocsResolver(projectConfiguration);
        });


        it('add one', () => {

            doc.resource.relations['BelongsTo'] = ['2'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([relatedDoc]);
        });


        it('remove one', () => {

            relatedDoc.resource.relations['Contains'] = ['1'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(undefined);
        });


        it('add one and remove one', () => {

            doc.resource.relations['BelongsTo'] = ['3'];
            relatedDoc.resource.relations['Contains'] = ['1'];

            const docsToUpdate
                = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc, anotherRelatedDoc], true);

            expect(docsToUpdate).toEqual([relatedDoc, anotherRelatedDoc]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(undefined);
            expect(anotherRelatedDoc.resource.relations['Contains']).toEqual(['1']);
        });


        it('dont touch a third party relation on add', () => {

            doc.resource.relations['BelongsTo'] = ['2'];
            relatedDoc.resource.relations['Contains'] = ['4'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(['1','4']);
        });


        it('dont touch a third party relation on remove', () => {

            relatedDoc.resource.relations['Contains'] = ['1','4'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(['4']);
        });


        it('dont update if existed before with additional relation in related doc', () => {

            doc.resource.relations['BelongsTo'] = ['2'];
            relatedDoc.resource.relations['Contains'] = ['1','4'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(['1','4']);
        });


        it('do not update if existed before', () => {

            doc.resource.relations['BelongsTo'] = ['2'];
            relatedDoc.resource.relations['Contains'] = ['1'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(['1']);
        });


        it('remove only', () => {

            doc.resource.relations['Contains'] = ['2'];
            relatedDoc.resource.relations['BelongsTo'] = ['1'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], false);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
        });


        it('dont add on remove only', () => {

            doc.resource.relations['Contains'] = ['2'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], false);

            expect(docsToUpdate).toEqual([]);
            expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
        });


        it('dont touch a third party relation on remove only', () => {

            relatedDoc.resource.relations['Contains'] = ['1', '4'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], false);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['Contains']).toEqual(['4']);
        });


        it('dont remove one-way relations of related documents', () => {

            doc.resource.relations['Contains'] = ['2'];
            relatedDoc.resource.relations['OneWay'] = ['1'];
            relatedDoc.resource.relations['BelongsTo'] = ['1'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], true);

            expect(docsToUpdate).toEqual([]);
            expect(relatedDoc.resource.relations['OneWay']).toEqual(['1']);
            expect(relatedDoc.resource.relations['BelongsTo']).toEqual(['1']);
        });


        it('remove one-way relations of related documents on remove only', () => {

            doc.resource.relations['Contains'] = ['2'];
            relatedDoc.resource.relations['OneWay'] = ['1'];
            relatedDoc.resource.relations['BelongsTo'] = ['1'];

            const docsToUpdate = connectedDocsResolver.determineDocsToUpdate(doc, [relatedDoc], false);

            expect(docsToUpdate).toEqual([relatedDoc]);
            expect(relatedDoc.resource.relations['OneWay']).toEqual(undefined);
            expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
        });
    });
}