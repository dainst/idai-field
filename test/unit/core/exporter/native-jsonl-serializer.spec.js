"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var native_jsonl_serializer_1 = require("../../../../app/core/exporter/native-jsonl-serializer");
/**
 * @author Thomas Kleinke
 */
describe('NativeJsonlSerializer', function () {
    var testDocuments = [
        {
            'created': { 'user': 'testuser', 'date': new Date() },
            'modified': [{ 'user': 'testuser', 'date': new Date() }],
            'resource': {
                'id': 'id1',
                'type': 'Find',
                'identifier': 'test1',
                'shortDescription': 'Test 1',
                'relations': {}
            }
        },
        {
            'created': { 'user': 'testuser', 'date': new Date() },
            'modified': [{ 'user': 'testuser', 'date': new Date() }],
            'resource': {
                'id': 'id2',
                'type': 'Find',
                'identifier': 'test2',
                'shortDescription': 'Test 2',
                'relations': {}
            }
        }
    ];
    it('should serialize resources to the native jsonl format', function () {
        var expectedResult = '{"id":"id1","type":"Find","identifier":"test1","shortDescription":"Test 1",' +
            '"relations":{}}\n{"id":"id2","type":"Find","identifier":"test2","shortDescription":"Test 2",' +
            '"relations":{}}\n';
        var serializer = new native_jsonl_serializer_1.NativeJsonlSerializer();
        var result = serializer.serialize(testDocuments);
        expect(result).toEqual(expectedResult);
    });
});
//# sourceMappingURL=native-jsonl-serializer.spec.js.map