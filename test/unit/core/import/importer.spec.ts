import {Observable} from 'rxjs';
// import {Import} from '../../../../app/core/import/import-facade';


/**
 * @author Daniel de Oliveira
 */
xdescribe('Importer', () => {

    let mockReader;
    let mockParser;
    let mockImportStrategy;
/*
    beforeEach(() => {

        mockReader = jasmine.createSpyObj('reader', ['go']);
        mockReader.go.and.callFake(function() {return Promise.resolve();});
        mockParser = jasmine.createSpyObj('parser', ['parse','getWarnings']);

        mockImportStrategy = jasmine.createSpyObj('importStrategy', ['preValidate', 'import']);
        mockImportStrategy.preValidate.and.returnValue(Promise.resolve([]));
    });


    it('should import until constraint violation is detected', async done => {

        mockParser.parse.and.callFake(function() {return Observable.create(observer => {
            observer.next({ resource: {type: 'Find', id: 'abc1', relations: {} }});
            observer.complete();
        })});

        mockImportStrategy.import.and.returnValue(Promise.resolve({errors: [['constraintviolation']]}));

        const importReport = await Import.go(mockReader, mockParser, mockImportStrategy);
        expect(importReport['errors'][0][0]).toBe('constraintviolation');
        done();
    });


    it('should import as long as no error is detected', async done => {

            mockParser.parse.and.callFake(function() {return Observable.create(observer => {
                observer.next({resource: {type: 'Find', id: 'abc1', relations: {} }});
                observer.next({resource: {type: 'Find', id: 'abc2', relations: {} }});
                observer.next({resource: {type: 'Find', id: 'abc3', relations: {} }});
                observer.complete();
            })});


            mockImportStrategy.import.and.returnValue(Promise.resolve({errors: [['constraintviolation']], importedResourcesIds: ['abc1']}));

            const importReport = await Import.go(
                mockReader,
                mockParser,
                mockImportStrategy);

            // expect(mockImportStrategy.importDoc).toHaveBeenCalledTimes(2); // TODO replace with something else
            expect(importReport.importedResourcesIds.length).toBe(1);
            expect(importReport.importedResourcesIds[0]).toEqual('abc1');
            done();
        }
    );
    */
});