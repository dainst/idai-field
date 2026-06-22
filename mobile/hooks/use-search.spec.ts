import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Document, PouchdbDatastore, Query } from 'idai-field-core';
import { Observable } from 'rxjs';
import { assoc } from 'tsfun';
import { bu1 } from '../test_data/test_docs/bu1';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';

jest.mock('../repositories/document-repository');
jest.mock('idai-field-core');

describe('useSearch', () => {
  let repository: DocumentRepository;

  beforeEach(async () => {
    repository = await DocumentRepository.init(
      'test',
      [] as any,
      new PouchdbDatastore((name) => new PouchDB(name), {
        generateId: () => '1',
      })
    );
  });

  it('should trigger empty search when initialized', async () => {
    const query = { categories: [] };
    renderHook(() => useSearch(repository, query));

    await waitFor(() => {
      expect(repository.find).toHaveBeenCalledWith({
        categories: query.categories,
      });
    });
  });

  it('should trigger find when q is changed', async () => {
    let query: Query = { categories: [] };
    const { rerender } = renderHook(() =>
      useSearch(repository, query)
    );

    await waitFor(() => expect(repository.find).toHaveBeenCalledTimes(1));

    await act(async () => {
      query = assoc('q', 'test', query);
      rerender();
    });

    await waitFor(() => {
      expect(repository.find).toHaveBeenLastCalledWith({
        q: 'test',
        categories: query.categories,
      });
    });
  });

  it('should trigger find when local changes are received', async () => {
    let triggerChange: () => void = () => undefined;
    repository.changed = jest.fn().mockImplementation(() => {
      return new Observable<Document>((subscriber) => {
        triggerChange = () => subscriber.next(bu1);
      });
    });

    const query = { categories: [] };
    renderHook(() => useSearch(repository, query));

    await waitFor(() => expect(repository.find).toHaveBeenCalledTimes(1));

    await act(async () => {
      triggerChange();
      triggerChange();
    });

    await waitFor(() => expect(repository.find).toHaveBeenCalledTimes(3));
  });

  it('should trigger find when remote changes are received', async () => {
    let triggerChange: () => void = () => undefined;
    repository.remoteChanged = jest.fn().mockImplementation(() => {
      return new Observable<Document>((subscriber) => {
        triggerChange = () => subscriber.next(bu1);
      });
    });

    const query = { categories: [] };
    renderHook(() => useSearch(repository, query));

    await waitFor(() => expect(repository.find).toHaveBeenCalledTimes(1));

    await act(async () => {
      triggerChange();
      triggerChange();
    });

    await waitFor(() => expect(repository.find).toHaveBeenCalledTimes(3));
  });
});
