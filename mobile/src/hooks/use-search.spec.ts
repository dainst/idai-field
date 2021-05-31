import { act, renderHook } from '@testing-library/react-hooks';
import { Document, PouchdbManager } from 'idai-field-core';
import { Observable } from 'rxjs';
import { bu1 } from '../../test_data/test_docs/bu1';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';

jest.mock('../repositories/document-repository');
jest.mock('idai-field-core');

describe('useSearch', () => {

    let repository: DocumentRepository;

    beforeEach(async () => {
        
        repository = await DocumentRepository.init('test', [], new PouchdbManager(name => new PouchDB(name)));
    });

    it('should trigger empty search when initialized', async () => {

        const categories: string[] = [];
        const { waitForNextUpdate } = renderHook(() => useSearch(repository, categories));

        await waitForNextUpdate();

        expect(repository.find).toHaveBeenCalledWith({ q: '', categories, constraints: undefined });
    });

    it('should trigger find when q is changed', async () => {

        const categories: string[] = [];
        const { result, waitForNextUpdate } = renderHook(() => useSearch(repository, categories));

        await waitForNextUpdate();

        const [_documents, setQ] = result.current;

        await act(async () => {
            setQ('test');
        });

        expect(repository.find)
            .toHaveBeenLastCalledWith({ q: 'test', categories: categories, constraints: undefined });

    });

    it('should trigger find when remote changes are received', async () => {

        let triggerChange: () => void;
        repository.remoteChanged = jest.fn().mockImplementation(() => {
            return new Observable<Document>(subscriber => {
                triggerChange = () => subscriber.next(bu1);
            });
        });

        const categories: string[] = [];
        const { waitForNextUpdate } = renderHook(() => useSearch(repository, categories));

        await waitForNextUpdate();

        await act(async () => {
            triggerChange();
            triggerChange();
        });

        expect(repository.find).toHaveBeenCalledTimes(3);

    });

});
