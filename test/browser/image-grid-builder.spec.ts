import {ImageGridBuilder} from "../../app/common/image-grid-builder";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('ImageGridBuilder', () => {

        var imageGridBuilder;

        var documents = [{
            id: "o1",
            resource: {
                id: "o1",
                identifier:"ob1",
                shortDescription:"name",
                height: "1",
                width: "2",
                filename: "abc"
            }
        }];

        beforeEach(function () {
            var blobProxyMock = {
                getBlobUrl: function() {
                    return {
                        then: function(callback) {
                            callback("url");
                            return {
                                catch: function(callback) {
                                    callback("err")
                                }
                            }
                        }
                    }
                }
            };

            imageGridBuilder = new ImageGridBuilder(
                <any> blobProxyMock, true);

        });

        it('should keep the aspect ration of an image', (done)=> {

            imageGridBuilder.calcGrid(documents,4,800).then(result=>{
                expect(result.rows[0][0].calculatedWidth).toBe(
                    result.rows[0][0].calculatedHeight * 2
                );
                done();
            });
        });


        it('should throw when nrOfColumns not integer', () => {

            expect(function(){imageGridBuilder.calcGrid([],4.1,0)}).toThrow();
        });

        it ('should accumulate errors', (done) => {

            var blobProxyMock = {
                getBlobUrl: function () {
                    return new Promise<any>((resolve,reject) => {
                        reject(['error']);
                    });
                }
            };

            imageGridBuilder = new ImageGridBuilder(
                <any> blobProxyMock, true);

            imageGridBuilder.calcGrid(documents,4,800).then(result=>{
                expect(result.rows[0][0].document.resource.identifier).toBe('ob1');
                expect(result.msgsWithParams).toContain(['error1']);
                done();
            });
        });
    })
}
