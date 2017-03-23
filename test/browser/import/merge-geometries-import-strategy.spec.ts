import {Importer} from "../../../app/import/importer";
import {Observable} from "rxjs/Observable";
import {MergeGeometriesImportStrategy} from "../../../app/import/merge-geometries-import-strategy";
import {ImportStrategy} from "../../../app/import/import-strategy";
import {IdaiFieldDatastore} from "../../../app/datastore/idai-field-datastore";


/**
 * @author Daniel de Oliveira
 */
export function main() {

    let strategy: ImportStrategy;
    let datastore;
    let originalDoc;
    let docToMerge;

    beforeEach(()=>{
        originalDoc = {
            resource: {
                id: "1",
                identifier: "i1",
                shortDescription: "sd1"
            }
        };

        docToMerge = {
            resource: {
                geometry: {a:"b"}
            }
        };

        datastore = jasmine.createSpyObj('datastore', ['findByIdentifier','update']);
        datastore.findByIdentifier.and.callFake(()=>Promise.resolve(originalDoc));
        datastore.update.and.callFake(()=>Promise.resolve(undefined));

        strategy = new MergeGeometriesImportStrategy(datastore);
    });

    describe('MergeGeometriesImportStrategy Tests ---', () => {
        it('should merge geometry',
            function (done) {
                strategy.importDoc(docToMerge)
                    .then(()=>{
                        expect(datastore.update).toHaveBeenCalledWith({
                            resource: {
                                id: "1",
                                identifier: "i1",
                                shortDescription: "sd1",
                                geometry: {a:"b"}
                            }
                        });
                        done();
                    },err=>{
                        fail('should not fail '+err);
                        done();
                    })
            }
        )
    })
}