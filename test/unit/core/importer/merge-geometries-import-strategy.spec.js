"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merge_geometries_import_strategy_1 = require("../../../../app/core/importer/merge-geometries-import-strategy");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('MergeGeometriesImportStrategy Tests ---', function () {
    var strategy;
    var mockValidator;
    var mockDatastore;
    var mockSettingsService;
    var originalDoc;
    var docToMerge;
    beforeEach(function () {
        originalDoc = {
            resource: {
                id: '1',
                identifier: 'i1',
                shortDescription: 'sd1'
            }
        };
        docToMerge = {
            resource: {
                geometry: { a: 'b' }
            }
        };
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockValidator.validate.and.callFake(function () { return Promise.resolve(); });
        mockDatastore = jasmine.createSpyObj('datastore', ['find', 'update']);
        mockDatastore.find.and.callFake(function () { return Promise.resolve({ documents: [originalDoc], totalCount: 1 }); });
        mockDatastore.update.and.callFake(function () { return Promise.resolve(undefined); });
        mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
        mockSettingsService.getUsername.and.callFake(function () { return 'testuser'; });
        strategy = new merge_geometries_import_strategy_1.MergeGeometriesImportStrategy(mockValidator, mockDatastore, mockSettingsService);
    });
    it('should merge geometry', function (done) {
        strategy.importDoc(docToMerge)
            .then(function () {
            var importedDoc = mockDatastore.update.calls.mostRecent().args[0];
            expect(importedDoc.resource).toEqual({
                id: '1',
                identifier: 'i1',
                shortDescription: 'sd1',
                geometry: { a: 'b' }
            });
            expect(importedDoc.modified).toBeDefined();
            expect(importedDoc.modified.length).toBe(1);
            expect(importedDoc.modified[0].user).toEqual('testuser');
            expect(importedDoc.modified[0].date).toBeDefined();
            done();
        }, function (err) {
            fail('should not fail ' + err);
            done();
        });
    });
});
//# sourceMappingURL=merge-geometries-import-strategy.spec.js.map