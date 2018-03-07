"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_grid_builder_1 = require("../../../app/components/imagegrid/image-grid-builder");
/**
 * @author Daniel de Oliveira
 */
describe('ImageGridConstruction', function () {
    var documents = [{
            id: 'o1',
            resource: {
                id: 'o1',
                identifier: 'ob1',
                shortDescription: 'name',
                height: '1',
                width: '2',
                originalFilename: 'abc'
            }
        }];
    it('should keep the aspect ration of an image', function () {
        var rows = image_grid_builder_1.ImageGridConstruction.calcGrid(documents, 4, 800);
        expect(rows[0][0].calculatedWidth).toBe(rows[0][0].calculatedHeight * 2);
    });
    it('should throw when nrOfColumns not integer', function () {
        expect(function () { image_grid_builder_1.ImageGridConstruction.calcGrid([], 4.1, 0); }).toThrow();
    });
});
//# sourceMappingURL=image-grid-builder.spec.js.map