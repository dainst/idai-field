"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("rxjs/Observable");
var importer_1 = require("../../../../app/core/importer/importer");
/**
 * @author Daniel de Oliveira
 */
describe('Importer', function () {
    var mockReader;
    var mockParser;
    var importer;
    var mockImportStrategy;
    var mockRelationsStrategy;
    var mockRollbackStrategy;
    var mockChangesStream;
    beforeEach(function () {
        mockReader = jasmine.createSpyObj('reader', ['go']);
        mockReader.go.and.callFake(function () { return Promise.resolve(); });
        mockParser = jasmine.createSpyObj('parser', ['parse']);
        mockImportStrategy = jasmine.createSpyObj('importStrategy', ['importDoc']);
        mockRelationsStrategy = jasmine.createSpyObj('relationsStrategy', ['completeInverseRelations', 'resetInverseRelations']);
        mockRollbackStrategy = jasmine.createSpyObj('rollbackStrategy', ['rollback']);
        mockChangesStream = jasmine.createSpyObj('changesStream', ['setAutoCacheUpdate']);
        importer = new importer_1.Importer();
    });
    it('should import until constraint violation is detected', function (done) {
        mockParser.parse.and.callFake(function () {
            return Observable_1.Observable.create(function (observer) {
                observer.next({ resource: { type: 'Find', id: 'abc1', relations: {} } });
                observer.complete();
            });
        });
        mockImportStrategy.importDoc.and.returnValue(Promise.reject(['constraintviolation']));
        mockRollbackStrategy.rollback.and.returnValue(Promise.resolve(undefined));
        importer.importResources(mockReader, mockParser, mockImportStrategy, mockRelationsStrategy, mockRollbackStrategy, null, mockChangesStream)
            .then(function (importReport) {
            expect(importReport['errors'][0][0]).toBe('constraintviolation');
            done();
        }, function () {
            fail();
            done();
        });
    });
    it('should import as long as no error is detected', function (done) {
        mockParser.parse.and.callFake(function () {
            return Observable_1.Observable.create(function (observer) {
                observer.next({ resource: { type: 'Find', id: 'abc1', relations: {} } });
                observer.next({ resource: { type: 'Find', id: 'abc2', relations: {} } });
                observer.next({ resource: { type: 'Find', id: 'abc3', relations: {} } });
                observer.complete();
            });
        });
        mockImportStrategy.importDoc.and.returnValues(Promise.resolve(undefined), Promise.reject(['constraintviolation']));
        mockRelationsStrategy.completeInverseRelations.and.returnValue(Promise.resolve(undefined));
        mockRelationsStrategy.resetInverseRelations.and.returnValue(Promise.resolve(undefined));
        mockRollbackStrategy.rollback.and.returnValue(Promise.resolve(undefined));
        importer.importResources(mockReader, mockParser, mockImportStrategy, mockRelationsStrategy, mockRollbackStrategy, null, mockChangesStream)
            .then(function (importReport) {
            expect(mockImportStrategy.importDoc).toHaveBeenCalledTimes(2);
            expect(importReport.importedResourcesIds.length).toBe(1);
            expect(importReport.importedResourcesIds[0]).toEqual('abc1');
            done();
        }, function () {
            fail();
            done();
        });
    });
});
//# sourceMappingURL=importer.spec.js.map