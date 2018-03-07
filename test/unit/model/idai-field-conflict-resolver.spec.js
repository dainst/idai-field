"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idai_field_conflict_resolver_1 = require("../../../app/core/model/idai-field-conflict-resolver");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('IdaiFieldConflictResolver', function () {
    var autoConflictResolver = new idai_field_conflict_resolver_1.IdaiFieldConflictResolver();
    var createDocument = function (id, rev, identifier, shortDescription, user) {
        return {
            _id: id,
            _rev: rev,
            resource: {
                id: id,
                identifier: identifier,
                shortDescription: shortDescription,
                type: 'Find',
                relations: { isRecordedIn: [] }
            },
            modified: [{ date: new Date(), user: user }],
            created: { date: new Date(), user: user }
        };
    };
    it('do not autosolve if the conflict cannot be solved automatically', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed1', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1_changed2', 'shortDescription1_changed', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision).toBeUndefined();
    });
    it('do not autosolve on relation conflict', function () {
        var originalRevision = createDocument('1', '1-xyz', 'identifier', 'shortDescription', 'testuser1');
        var conflictedRevision = createDocument('1', '2-abc', 'identifier', 'shortDescription', 'testuser1');
        var latestRevision = createDocument('1', '2-def', 'identifier', 'shortDescription', 'testuser2');
        latestRevision.resource.relations['isRecordedIn'] = ['2'];
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision).toBeUndefined();
    });
    it('autosolve a conflict where one flat field was added in conflicted revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.number = '1';
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.number).toEqual('1');
    });
    it('autosolve a conflict where one flat field was added in latest revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.number = '1';
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.number).toEqual('1');
    });
    it('autosolve a conflict where two different flat fields were added in latest revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.number = '1';
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.provenance = 'provenance';
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.number).toEqual('1');
        expect(updatedLatestRevision.resource.provenance).toEqual('provenance');
    });
    it('autosolve a conflict where one flat field has changed in conflicted revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.identifier).toEqual('identifier1_changed');
    });
    it('autosolve a conflict where one flat field has changed in latest revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1_changed', 'shortDescription1', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.identifier).toEqual('identifier1_changed');
    });
    it('autosolve a conflict where two different flat fields have changed', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1_changed', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.identifier).toEqual('identifier1_changed');
        expect(updatedLatestRevision.resource.shortDescription).toEqual('shortDescription1_changed');
    });
    it('autosolve a conflict where one object field was added in conflicted revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.type).toEqual('Point');
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([1.0, 2.0]);
    });
    it('autosolve a conflict where one object field was added in latest revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.type).toEqual('Point');
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([1.0, 2.0]);
    });
    it('autosolve a conflict where two different object fields were added', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.georeference = { topLeftCoordinates: [1.0, 1.0], topRightCoordinates: [2.0, 1.0],
            bottomLeftCoordinates: [1.0, 2.0] };
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.type).toEqual('Point');
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([1.0, 2.0]);
        expect(updatedLatestRevision.resource.georeference).toBeDefined();
        expect(updatedLatestRevision.resource.georeference.topLeftCoordinates).toEqual([1.0, 1.0]);
        expect(updatedLatestRevision.resource.georeference.topRightCoordinates).toEqual([2.0, 1.0]);
        expect(updatedLatestRevision.resource.georeference.bottomLeftCoordinates).toEqual([1.0, 2.0]);
    });
    it('autosolve a conflict where one object field has changed in conflicted revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        originalRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.geometry = { 'type': 'Point', 'coordinates': [2.0, 1.0] };
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([2.0, 1.0]);
    });
    it('autosolve a conflict where one object field has changed in latest revision', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        originalRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.geometry = { 'type': 'Point', 'coordinates': [2.0, 1.0] };
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([2.0, 1.0]);
    });
    it('autosolve a conflict where two different object fields have changed', function () {
        var originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
        originalRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        originalRevision.resource.georeference = { topLeftCoordinates: [1.0, 1.0], topRightCoordinates: [2.0, 1.0],
            bottomLeftCoordinates: [1.0, 2.0] };
        var conflictedRevision = createDocument('id1', '2-abc', 'identifier1', 'shortDescription1', 'testuser1');
        conflictedRevision.resource.geometry = { 'type': 'Point', 'coordinates': [2.0, 1.0] };
        conflictedRevision.resource.georeference = { topLeftCoordinates: [1.0, 1.0],
            topRightCoordinates: [2.0, 1.0], bottomLeftCoordinates: [1.0, 2.0] };
        var latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1', 'testuser2');
        latestRevision.resource.geometry = { 'type': 'Point', 'coordinates': [1.0, 2.0] };
        latestRevision.resource.georeference = { topLeftCoordinates: [2.0, 2.0], topRightCoordinates: [3.0, 2.0],
            bottomLeftCoordinates: [2.0, 3.0] };
        var updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
        expect(updatedLatestRevision.resource.geometry).toBeDefined();
        expect(updatedLatestRevision.resource.geometry.coordinates).toEqual([2.0, 1.0]);
        expect(updatedLatestRevision.resource.georeference).toBeDefined();
        expect(updatedLatestRevision.resource.georeference.topLeftCoordinates).toEqual([2.0, 2.0]);
        expect(updatedLatestRevision.resource.georeference.topRightCoordinates).toEqual([3.0, 2.0]);
        expect(updatedLatestRevision.resource.georeference.bottomLeftCoordinates).toEqual([2.0, 3.0]);
    });
    // TODO add tests for array fields
});
//# sourceMappingURL=idai-field-conflict-resolver.spec.js.map