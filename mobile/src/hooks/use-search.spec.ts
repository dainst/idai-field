import { act, renderHook } from '@testing-library/react-hooks';
import { PouchdbManager } from 'idai-field-core';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';

jest.mock('../repositories/document-repository');
jest.mock('idai-field-core');

describe('useSearch', () => {

    let repository: DocumentRepository;

    beforeAll(async () => {
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

        act(() => {
            setQ('test');
        });

        expect(repository.find)
            .toHaveBeenLastCalledWith({ q: 'test', categories: categories, constraints: undefined });

    });

});
