import {Importer} from "../../app/import/importer";
import {Parser, ParserResult} from "../../app/import/parser";
import {Observable} from "rxjs/Observable";


/**
 * @author Daniel de Oliveira
 */
export function main() {

    let mockReader;
    let mockParser;
    let importer;

    beforeEach(()=>{
        mockReader = jasmine.createSpyObj('reader',['read']);
        mockReader.read.and.callFake(function() {return Promise.resolve();});
        mockParser = jasmine.createSpyObj('parser',['parse']);
        mockParser.parse.and.callFake(function() {return Observable.create(observer => {
            observer.next({
                document: {
                    resource: {type:"object",id:"abc",relations:{}}
                },
                messages: []
            });
            observer.complete();
        })});
        let mockDatastore = jasmine.createSpyObj('datastore', ['create']);
        let mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockValidator.validate.and.callFake(function() {return Promise.resolve();});
        importer = new Importer(mockDatastore,mockValidator);
    });

    describe('Importer', () => {
        it('should do something',
            function (done) {
                importer.importResources(mockReader,mockParser)
                    .then(()=>{
                        done();
                    })
                    .catch(()=>{
                        fail();
                        done();
                    })
            }
        );
    })
}