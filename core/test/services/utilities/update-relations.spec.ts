import { updateRelations } from '../../../src/services/utilities/update-relations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('updateRelations', () => {

    let doc;
    let relatedDoc;
    let anotherRelatedDoc;

    const relationInverses = {
        Above: 'Below',
        Below: 'Above',
        isRecordedIn: undefined
    };

    beforeEach(() => {

        doc = { 'resource' : {
            'id' :'1', 'identifier': 'ob1',
            'category': 'object',
            'relations' : {}
        }};
        relatedDoc = { 'resource' : {
            'id': '2' , 'identifier': 'ob2',
            'category': 'object',
            'relations' : {}
        }};
        anotherRelatedDoc = { 'resource' : {
            'id': '3' , 'identifier': 'ob3',
            'category': 'object',
            'relations' : {}
        }};
    });


    it('add one', () => {

        doc.resource.relations['Below'] = ['2'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([relatedDoc]);
    });


    it('remove one', () => {

        relatedDoc.resource.relations['Above'] = ['1'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Above']).toEqual(undefined);
    });


    it('add one and remove one', () => {

        doc.resource.relations['Below'] = ['3'];
        relatedDoc.resource.relations['Above'] = ['1'];

        const docsToUpdate
            = updateRelations(
                doc, [relatedDoc, anotherRelatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([relatedDoc, anotherRelatedDoc]);
        expect(relatedDoc.resource.relations['Above']).toEqual(undefined);
        expect(anotherRelatedDoc.resource.relations['Above']).toEqual(['1']);
    });


    it('dont touch a third party relation on add', () => {

        doc.resource.relations['Below'] = ['2'];
        relatedDoc.resource.relations['Above'] = ['4'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Above'].length).toEqual(2);
        expect(relatedDoc.resource.relations['Above'])
            .toEqual(jasmine.arrayContaining(['1', '4']));
    });


    it('dont touch a third party relation on remove', () => {

        relatedDoc.resource.relations['Above'] = ['1','4'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Above']).toEqual(['4']);
    });


    it('dont update if existed before with additional relation in related doc', () => {

        doc.resource.relations['Below'] = ['2'];
        relatedDoc.resource.relations['Above'] = ['1','4'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['Above'].length).toEqual(2);
        expect(relatedDoc.resource.relations['Above'])
            .toEqual(jasmine.arrayContaining(['1', '4']));
    });


    it('do not update if existed before', () => {

        doc.resource.relations['Below'] = ['2'];
        relatedDoc.resource.relations['Above'] = ['1'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['Above']).toEqual(['1']);
    });


    it('remove only', () => {

        doc.resource.relations['Above'] = ['2'];
        relatedDoc.resource.relations['Below'] = ['1'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses, false);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Below']).toEqual(undefined);
    });


    it('dont add on remove only', () => {

        doc.resource.relations['Above'] = ['2'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses, false);

        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['Below']).toEqual(undefined);
    });


    it('dont touch a third party relation on remove only', () => {

        relatedDoc.resource.relations['Above'] = ['1', '4'];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses, false);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Above']).toEqual(['4']);
    });


    // specific behaviour for unidirectional relations

    function adjustDocsForUnidirectionalRelationsTests() {

        doc.resource.relations['Above'] = ['2'];
        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Below'] = ['1'];
    }


    it('dont remove isRecordedIn relations of related documents', () => {

        adjustDocsForUnidirectionalRelationsTests();

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);

        // isBelow and isRecordedIn were both already set, so no update necessary
        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['isRecordedIn']).toEqual(['1']);
        expect(relatedDoc.resource.relations['Below']).toEqual(['1']);
    });


    it('remove isRecordedIn relations of related documents on remove only', () => {

        adjustDocsForUnidirectionalRelationsTests();

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses, false);

        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['isRecordedIn']).toEqual(undefined);
        expect(relatedDoc.resource.relations['Below']).toEqual(undefined);
    });


    it('do not add isRecordedInRelation', () => {

        doc.resource.relations['isRecordedIn'] = ['2'];
        relatedDoc.resource.relations['isRecordedIn'] = [];

        const docsToUpdate = updateRelations(
            doc, [relatedDoc], relationInverses);
        expect(docsToUpdate).toEqual([]);
        expect(Object.keys(relatedDoc.resource.relations).length).toEqual(0);
    });
});
