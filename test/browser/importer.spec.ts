import {Importer} from "../../app/import/importer";
import {Observable} from "rxjs/Observable";
import {M} from "../../app/m";
import {DefaultImportStrategy} from "../../app/import/default-import-strategy";
import {ImportStrategy} from "../../app/import/import-strategy";


/**
 * @author Daniel de Oliveira
 */
export function main() {

    let mockReader;
    let mockParser;
    let importer;
    let mockValidator;
    let mockDatastore;
    let importStrategy: ImportStrategy;

    beforeEach(()=>{
        mockReader = jasmine.createSpyObj('reader',['read']);
        mockReader.read.and.callFake(function() {return Promise.resolve();});
        mockParser = jasmine.createSpyObj('parser',['parse']);
        mockDatastore = jasmine.createSpyObj('datastore', ['create']);
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockValidator.validate.and.callFake(function() {return Promise.resolve();});
        mockDatastore.create.and.callFake(function(a){return Promise.resolve(a)});
        importStrategy = new DefaultImportStrategy(mockValidator,mockDatastore);
        importer = new Importer();
    });

    describe('Importer', () => {
        it('should import until constraint violation is detected',
            function (done) {
                mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                    observer.next({ document: {resource: {type: "object", id:"abc1",relations:{} }}, messages: []});
                    observer.complete();
                })});

                mockValidator.validate.and.returnValue(Promise.reject(['constraintviolation']));
                importer.importResources(mockReader,mockParser,importStrategy)
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
                    observer.complete();
                })});

                mockValidator.validate.and.returnValues(Promise.resolve(undefined),Promise.reject(['constraintviolation']));
                importer.importResources(mockReader,mockParser,importStrategy)
                    .then(importReport=>{
                        expect(mockDatastore.create).toHaveBeenCalledTimes(1);
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