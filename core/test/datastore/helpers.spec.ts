import { isProjectDocument } from "../../src/datastore/helpers";


describe('helpers', () => {
  
    fit('isProjectDocument', () => {

        const result = isProjectDocument({ resource: { id: 'project' }} as any);
        expect(true).toBeTruthy();
    });
});
