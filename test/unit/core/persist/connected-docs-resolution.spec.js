"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("idai-components-2/core");
var connected_docs_resolution_1 = require("../../../../app/core/persist/connected-docs-resolution");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConnectedDocsResolution', function () {
    var projectConfiguration = new core_1.ProjectConfiguration({
        'types': [],
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
                'name': 'isRecordedIn',
                'label': 'Einweg'
            }
        ]
    });
    var doc;
    var relatedDoc;
    var anotherRelatedDoc;
    beforeEach(function () {
        doc = { 'resource': {
                'id': '1', 'identifier': 'ob1',
                'type': 'object',
                'relations': {}
            } };
        relatedDoc = { 'resource': {
                'id': '2', 'identifier': 'ob2',
                'type': 'object',
                'relations': {}
            } };
        anotherRelatedDoc = { 'resource': {
                'id': '3', 'identifier': 'ob3',
                'type': 'object',
                'relations': {}
            } };
    });
    it('add one', function () {
        doc.resource.relations['BelongsTo'] = ['2'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([relatedDoc]);
    });
    it('remove one', function () {
        relatedDoc.resource.relations['Contains'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(undefined);
    });
    it('add one and remove one', function () {
        doc.resource.relations['BelongsTo'] = ['3'];
        relatedDoc.resource.relations['Contains'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc, anotherRelatedDoc]);
        expect(docsToUpdate).toEqual([relatedDoc, anotherRelatedDoc]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(undefined);
        expect(anotherRelatedDoc.resource.relations['Contains']).toEqual(['1']);
    });
    it('dont touch a third party relation on add', function () {
        doc.resource.relations['BelongsTo'] = ['2'];
        relatedDoc.resource.relations['Contains'] = ['4'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(['1', '4']);
    });
    it('dont touch a third party relation on remove', function () {
        relatedDoc.resource.relations['Contains'] = ['1', '4'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(['4']);
    });
    it('dont update if existed before with additional relation in related doc', function () {
        doc.resource.relations['BelongsTo'] = ['2'];
        relatedDoc.resource.relations['Contains'] = ['1', '4'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(['1', '4']);
    });
    it('do not update if existed before', function () {
        doc.resource.relations['BelongsTo'] = ['2'];
        relatedDoc.resource.relations['Contains'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(['1']);
    });
    it('remove only', function () {
        doc.resource.relations['Contains'] = ['2'];
        relatedDoc.resource.relations['BelongsTo'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc], false);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
    });
    it('dont add on remove only', function () {
        doc.resource.relations['Contains'] = ['2'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc], false);
        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
    });
    it('dont touch a third party relation on remove only', function () {
        relatedDoc.resource.relations['Contains'] = ['1', '4'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc], false);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['Contains']).toEqual(['4']);
    });
    // isRecordedIn specific behaviour
    it('dont remove isRecordedIn relations of related documents', function () {
        doc.resource.relations['Contains'] = ['2'];
        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['BelongsTo'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([]);
        expect(relatedDoc.resource.relations['isRecordedIn']).toEqual(['1']);
        expect(relatedDoc.resource.relations['BelongsTo']).toEqual(['1']);
    });
    it('remove isRecordedIn relations of related documents on remove only', function () {
        doc.resource.relations['Contains'] = ['2'];
        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['BelongsTo'] = ['1'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc], false);
        expect(docsToUpdate).toEqual([relatedDoc]);
        expect(relatedDoc.resource.relations['isRecordedIn']).toEqual(undefined);
        expect(relatedDoc.resource.relations['BelongsTo']).toEqual(undefined);
    });
    it('do not add isRecordedInRelation', function () {
        doc.resource.relations['isRecordedIn'] = ['2'];
        var docsToUpdate = connected_docs_resolution_1.ConnectedDocsResolution.determineDocsToUpdate(projectConfiguration, doc, [relatedDoc]);
        expect(docsToUpdate).toEqual([]);
        expect(Object.keys(relatedDoc.resource.relations).length).toEqual(0);
    });
});
//# sourceMappingURL=connected-docs-resolution.spec.js.map