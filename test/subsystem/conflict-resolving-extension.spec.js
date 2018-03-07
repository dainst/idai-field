"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conflict_resolving_extension_1 = require("../../app/core/datastore/core/conflict-resolving-extension");
/**
 * @author Daniel de Oliveira
 */
function main() {
    describe('ConflictResolvingExtension', function () {
        var originalRevision;
        var conflictedRevision;
        var latestRevision;
        var datastore;
        var db;
        var conflictResolver;
        var extension;
        beforeEach(function () {
            originalRevision = {
                resource: {
                    type: 'Find',
                    id: '1',
                    relations: {}
                },
                created: { user: 'testuser1', date: new Date() },
                modified: [{ user: 'testuser1', date: new Date() }]
            };
            originalRevision['_rev'] = '1-hij';
            conflictedRevision = {
                resource: {
                    type: 'Find',
                    id: '1',
                    relations: {}
                },
                created: { user: 'testuser1', date: new Date() },
                modified: [{ user: 'testuser1', date: new Date() }]
            };
            conflictedRevision['_rev'] = '2-xyz';
            latestRevision = {
                resource: {
                    type: 'Find',
                    id: '1',
                    relations: {}
                },
                created: { user: 'testuser1', date: new Date() },
                modified: [{ user: 'testuser1', date: new Date() }]
            };
            latestRevision['_rev'] = '2-abc';
            latestRevision['_conflicts'] = ['2-xyz'];
            datastore = jasmine.createSpyObj('datastore', ['fetchRevision', 'fetch',
                'removeRevision']);
            db = jasmine.createSpyObj('db', ['put']);
            conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);
            db.put.and.callFake(function () { return Promise.resolve(undefined); });
            datastore.removeRevision.and.callFake(function () { return Promise.resolve(undefined); });
            datastore.fetchRevision.and.callFake(function (resourceId, revisionId) {
                if (resourceId != '1')
                    return Promise.reject(undefined);
                if (revisionId == '2-xyz')
                    return Promise.resolve(conflictedRevision);
                if (revisionId == '1-hij')
                    return Promise.resolve(originalRevision);
                return Promise.reject(undefined);
            });
            datastore.fetch.and.callFake(function (resourceId, options) {
                if (resourceId != '1')
                    return Promise.reject(undefined);
                if (options.revs_info == true) {
                    return Promise.resolve({ _revs_info: [{ rev: '1-hij', status: 'available' }] });
                }
                else {
                    return Promise.reject(undefined);
                }
            });
            extension = new conflict_resolving_extension_1.ConflictResolvingExtension();
            extension.setDatastore(datastore);
            extension.setDb(db);
            extension.setConflictResolver(conflictResolver);
        });
        it('update one doc', function (done) {
            conflictResolver.tryToSolveConflict.and.returnValue(latestRevision);
            extension.autoResolve(latestRevision, 'testuser1').then(function () {
                expect(conflictResolver.tryToSolveConflict)
                    .toHaveBeenCalledWith(latestRevision, conflictedRevision, originalRevision);
                expect(db.put).toHaveBeenCalledWith(latestRevision, { force: true });
                done();
            });
        });
        it('do not update doc if not by local user', function (done) {
            conflictResolver.tryToSolveConflict.and.returnValue(latestRevision);
            extension.autoResolve(latestRevision, 'testuser2').then(function () {
                expect(conflictResolver.tryToSolveConflict).not.toHaveBeenCalled();
                expect(db.put).not.toHaveBeenCalled();
                done();
            });
        });
        it('do not update doc if conflicts not resolved', function (done) {
            conflictResolver.tryToSolveConflict.and.returnValue(undefined);
            extension.autoResolve(latestRevision, 'testuser1').then(function () {
                expect(conflictResolver.tryToSolveConflict)
                    .toHaveBeenCalledWith(latestRevision, conflictedRevision, originalRevision);
                expect(db.put).not.toHaveBeenCalled();
                done();
            });
        });
    });
}
exports.main = main;
//# sourceMappingURL=conflict-resolving-extension.spec.js.map