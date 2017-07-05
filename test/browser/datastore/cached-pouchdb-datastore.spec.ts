import {Document} from "idai-components-2/core";
import {CachedPouchdbDatastore} from "../../../app/datastore/cached-pouchdb-datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('CachedPouchdbDatastore', () => {

        let datastore: CachedPouchdbDatastore;

        function doc(sd, identifier?): Document {
            return {
                resource: {
                    shortDescription: sd,
                    identifier: identifier,
                    title: "title",
                    type: "object",
                    relations: {}
                }
            }
        }

        beforeEach(
            function () {
                const mockdb = jasmine.createSpyObj('mockdb', ['find','documentChangesNotifications','create','update']);
                mockdb.update.and.callFake(function(dd){
                    // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
                    dd.resource.id = '1';
                    dd['_rev'] = '2';
                    return Promise.resolve(dd);
                });
                mockdb.find.and.callFake(function() {
                    const d = doc('sd1');
                    d.resource.id = '1';
                    return Promise.resolve([d]);
                });
                mockdb.create.and.callFake(function(dd) {
                    // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
                    dd.resource.id = '1';
                    return Promise.resolve(dd);
                });
                mockdb.documentChangesNotifications.and.callFake(function() {return {subscribe: function(){}}});

                datastore = new CachedPouchdbDatastore(mockdb);
            }
        );

       it('should return the cached instance on of create', function(done) {

            let doc1 = doc('sd1','identifier1');

            datastore.create(doc1)
                .then(() => datastore.find({q: 'sd1'})) // mockdb returns other instance
                .then(result => {
                    expect((result[0] as Document).resource['identifier']).toBe('identifier1');
                    doc1.resource['shortDescription'] = 's4';
                    expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                    done();
                }).catch(err => {
                    fail(err);
                    done();
                });
        });

       it ('should return cached instance of update', (done)=>{
           let doc1 = doc('sd1','identifier1');
           let doc2;

           datastore.create(doc1)
               .then(() => {
                    doc2 = doc('sd1','identifier_');
                    doc2.resource.id = '1';
                    return datastore.update(doc2);
               })
               .then(() => datastore.find({q: 'sd1'})) // mockdb returns other instance
               .then(result => {
                   expect((result[0] as Document)['_rev']).toBe('2');
                   expect((result[0] as Document).resource['identifier']).toBe('identifier_');
                   doc2.resource['shortDescription'] = 's4';
                   expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                   done();
               }).catch(err => {
               fail(err);
               done();
           });
       });
    });
}