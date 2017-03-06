import {Importer} from "../../../app/import/importer";
import {Observable} from "rxjs/Observable";
import {ImportStrategy} from "../../../app/import/import-strategy";


/**
 * @author Daniel de Oliveira
 */
export function main() {

    let mockReader;
    let mockParser;
    let importer;
    let mockImportStrategy;

    beforeEach(()=>{
        mockReader = jasmine.createSpyObj('reader',['read']);
        mockReader.importDoc.and.callFake(function() {return Promise.resolve();});
        mockParser = jasmine.createSpyObj('parser',['parse']);

        mockImportStrategy = jasmine.createSpyObj('importStrategy',['go']);
        importer = new Importer();
    });

    describe('Importer', () => {
        it('should import until constraint violation is detected',
            function (done) {
                mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                    observer.next({ document: {resource: {type: "object", id:"abc1",relations:{} }}, messages: []});
                    observer.complete();
                })});

                mockImportStrategy.importDoc.and.returnValue(Promise.reject(['constraintviolation']));
                importer.importResources(mockReader,mockParser,mockImportStrategy)
                    .then(importReport=>{
                        expect(importReport['errors'][0][0]).toBe('constraintviolation');
                        done();
                    },() => {
                        fail();
                        done();
                    })
            }
        );

        it('should import as long as no error is detected',
            function (done) {
                mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                    observer.next({ document: {resource: {type: "object", id:"abc1",relations:{} }}, messages: []});
                    observer.next({ document: {resource: {type: "object", id:"abc2",relations:{} }}, messages: []});
                    observer.next({ document: {resource: {type: "object", id:"abc3",relations:{} }}, messages: []});
                    observer.complete();
                })});

                mockImportStrategy.importDoc.and.returnValues(Promise.resolve(undefined),Promise.reject(['constraintviolation']));
                importer.importResources(mockReader,mockParser,mockImportStrategy)
                    .then(importReport=>{
                        expect(mockImportStrategy.importDoc).toHaveBeenCalledTimes(2);
                        expect(importReport['successful_imports']).toBe(1);
                        done();
                    },err => {
                        fail();
                        done();
                    })
            }
        );
    })
}