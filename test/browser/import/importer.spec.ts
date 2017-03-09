import {Importer} from "../../../app/import/importer";
import {Observable} from "rxjs/Observable";


/**
 * @author Daniel de Oliveira
 */
export function main() {

    let mockReader;
    let mockParser;
    let importer: Importer;
    let mockImportStrategy;

    beforeEach(()=>{
        mockReader = jasmine.createSpyObj('reader', ['go']);
        mockReader.go.and.callFake(function() {return Promise.resolve();});
        mockParser = jasmine.createSpyObj('parser', ['parse']);

        mockImportStrategy = jasmine.createSpyObj('importStrategy', ['importDoc']);
        importer = new Importer();
    });

    describe('Importer', () => {
        it('should import until constraint violation is detected',
            function (done) {
                mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                    observer.next({ resource: {type: 'object', id: 'abc1', relations: {} }});
                    observer.complete();
                })});

                mockImportStrategy.importDoc.and.returnValue(Promise.reject(['constraintviolation']));
                importer.importResources(mockReader, mockParser, mockImportStrategy)
                    .then(importReport=>{
                        expect(importReport['errors'][0][0]).toBe('constraintviolation');
                        done();
                    }, () => {
                        fail();
                        done();
                    })
            }
        );

        it('should import as long as no error is detected',
            function (done) {
                mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                    observer.next({resource: {type: 'object', id: 'abc1', relations: {} }});
                    observer.next({resource: {type: 'object', id: 'abc2', relations: {} }});
                    observer.next({resource: {type: 'object', id: 'abc3', relations: {} }});
                    observer.complete();
                })});

                mockImportStrategy.importDoc.and.returnValues(Promise.resolve(undefined),
                    Promise.reject(['constraintviolation']));
                importer.importResources(mockReader, mockParser, mockImportStrategy)
                    .then(importReport => {
                        expect(mockImportStrategy.importDoc).toHaveBeenCalledTimes(2);
                        expect(importReport.importedResourcesIds.length).toBe(1);
                        expect(importReport.importedResourcesIds[0]).toEqual('abc1');
                        done();
                    }, () => {
                        fail();
                        done();
                    })
            }
        );
    })
}