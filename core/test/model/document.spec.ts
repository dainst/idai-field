import {Document} from '../../src/model/document';


/**
 * @author Daniel de Oliveira
 */
describe('Document', () => {

    it('removeFields', () => {

        const d: Document = {
            _id: '1',
            resource: {
                category: 'a',
                id: '1',
                relations: {}
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        expect(d.resource.category).not.toBeUndefined();
        const d0 = Document.removeFields(['category'])(d);
        expect(d0.resource.category).toBeUndefined();
    });
}); // for some reason /* gets inserted and causes problems without this comment