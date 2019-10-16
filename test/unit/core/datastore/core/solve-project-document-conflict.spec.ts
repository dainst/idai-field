import {take} from 'tsfun';
import {Document} from 'idai-components-2';
import {solveProjectDocumentConflict} from '../../../../../app/core/datastore/core/solve-project-document-conflicts';
import {clone} from '../../../../../app/core/util/object-util';
import {last} from '../../../../../app/core/datastore/core/project-resource-conflict-resolution';


describe('solveProjectDocumentConflict', () => {


    it('basic', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['_'];

        const conflicted: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };

        const solved = await solveProjectDocumentConflict(
            current,
            take(1),
            last,
            (_: string) => Promise.resolve(clone(current)),
            (_: string, __: string) => Promise.resolve(clone(conflicted)),
            (document: Document) => {
                return Promise.resolve(document);
            }
        );

        expect(solved.resource.id).toBe('1'); // TODO improve
        done();
    });
});