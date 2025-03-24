import { ChangesHistoryModalComponent } from '../../../../src/app/components/widgets/change-history-modal.component';

/**
 * @author Nicolas Antunes
 */
describe('sortBy', () => {
    
    let changeHistoryComponent: ChangesHistoryModalComponent;


    beforeEach(() => {
        
        changeHistoryComponent = new ChangesHistoryModalComponent(null);
       
        changeHistoryComponent.document = {
            _id: 'test_id',
            resource: { id: 'testId', 
                identifier: 'testIdentifier', 
                category: 'testCategory', 
                relations: {} 
            }, 
            created: { date: new Date('2023-10-01T10:00:00Z'), user: 'Simone Veil' },
            modified: [
                { date: new Date('2024-10-01T10:20:00Z'), user: 'Simone Veil' },
                { date: new Date('2025-01-14T10:07:09.665Z'), user: 'Marie Curie' },
                { date: new Date('2024-10-01T09:22:00Z'), user: 'Nelson Mandela' }
            ]
        };

        changeHistoryComponent.initialize();
    });


    test('sort documentModificationList by date in descending order', () => {

        changeHistoryComponent.sortBy('date', true);

        expect(changeHistoryComponent.documentModificationList[0].date.toISOString()).toBe('2024-10-01T09:22:00.000Z');
        expect(changeHistoryComponent.documentModificationList[1].date.toISOString()).toBe('2024-10-01T10:20:00.000Z');
        expect(changeHistoryComponent.documentModificationList[2].date.toISOString()).toBe('2025-01-14T10:07:09.665Z');

    });
    

    test('sort documentModificationList by date in ascending order', () => {

        changeHistoryComponent.sortBy('date', false);

        expect(changeHistoryComponent.documentModificationList[2].date.toISOString()).toBe('2024-10-01T09:22:00.000Z');
        expect(changeHistoryComponent.documentModificationList[1].date.toISOString()).toBe('2024-10-01T10:20:00.000Z');
        expect(changeHistoryComponent.documentModificationList[0].date.toISOString()).toBe('2025-01-14T10:07:09.665Z');
    });


    test('sort documentModificationList by user in ascending order (case-insensitive)', () => {

        changeHistoryComponent.sortBy('user', true);

        expect(changeHistoryComponent.documentModificationList[0].user).toBe('Marie Curie');
        expect(changeHistoryComponent.documentModificationList[1].user).toBe('Nelson Mandela');
        expect(changeHistoryComponent.documentModificationList[2].user).toBe('Simone Veil');
    });


    test('sort documentModificationList by user in descending order (case-insensitive)', () => {

        changeHistoryComponent.sortBy('user', false);

        expect(changeHistoryComponent.documentModificationList[2].user).toBe('Marie Curie');
        expect(changeHistoryComponent.documentModificationList[1].user).toBe('Nelson Mandela');
        expect(changeHistoryComponent.documentModificationList[0].user).toBe('Simone Veil');
    });
});