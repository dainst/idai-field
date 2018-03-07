"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var default_import_strategy_1 = require("../../../../app/core/importer/default-import-strategy");
/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportStrategy', function () {
    var mockDatastore;
    var mockValidator;
    var mockSettingsService;
    var mockConfigLoader;
    var importStrategy;
    beforeEach(function () {
        mockDatastore = jasmine.createSpyObj('datastore', ['create']);
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
        mockConfigLoader = jasmine.createSpyObj('configLoader', ['getProjectConfiguration']);
        mockValidator.validate.and.callFake(function () { return Promise.resolve(); });
        mockDatastore.create.and.callFake(function (a) { return Promise.resolve(a); });
        mockSettingsService.getUsername.and.callFake(function () { return 'testuser'; });
        mockConfigLoader.getProjectConfiguration.and.callFake(function () { return null; });
        importStrategy = new default_import_strategy_1.DefaultImportStrategy(mockValidator, mockDatastore, mockSettingsService, mockConfigLoader);
    });
    it('should resolve on success', function (done) {
        importStrategy.importDoc({ resource: { type: undefined, id: undefined, relations: undefined } })
            .then(function () { return done(); }, function () { fail(); done(); });
    });
    it('should reject on err in validator', function (done) {
        mockValidator.validate.and.callFake(function () { return Promise.reject(['abc']); });
        importStrategy.importDoc({ resource: { type: undefined, id: undefined, relations: undefined } })
            .then(function () { fail(); done(); }, function (err) {
            expect(err[0]).toBe('abc');
            done();
        });
    });
    it('should reject on err in datastore', function (done) {
        mockDatastore.create.and.callFake(function () { return Promise.reject(['abc']); });
        importStrategy.importDoc({ resource: { type: undefined, id: undefined, relations: undefined } })
            .then(function () { return done(); }, function (err) {
            expect(err[0]).toBe('abc');
            done();
        });
    });
});
//# sourceMappingURL=default-import-strategy.spec.js.map