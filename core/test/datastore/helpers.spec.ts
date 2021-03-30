import { isProjectDocument } from '../../src/datastore/helpers';


describe('helpers', () => {
  
    it('isProjectDocument', () => {

        const result = isProjectDocument({ resource: { id: 'project' }} as any);
        expect(result).toBeTruthy();
    });
});
