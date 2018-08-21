import {Document} from '../../../../src/core/model/document';


/**
 * @author Daniel de Oliveira
 */
describe('Document', () => {

    it('removeFields', () => {

        const d: Document = {
            resource: {
                type: "a",
                id: "1",
                relations: {}
            },
            modified: [],
            created: {user: "a", date: new Date()}
        };

        expect(d.resource.type).not.toBeUndefined();
        const d0 = Document.removeFields(['type'])(d);
        expect(d0.resource.type).toBeUndefined();
    });
}); // for some reason /* gets inserted and causes problems without this comment