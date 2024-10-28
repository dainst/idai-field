import { act, renderHook } from '@testing-library/react-hooks';
import { Document, PouchdbDatastore, Query } from 'idai-field-core';
import { Observable } from 'rxjs';
import { assoc } from 'tsfun';
import { bu1 } from '../../test_data/test_docs/bu1';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';

jest.mock('../repositories/document-repository');
jest.mock('idai-field-core');

describe('useSearch', () => {
  let repository: DocumentRepository;

  beforeEach(async () => {
    repository = await DocumentRepository.init(
      'test',
      [],
      new PouchdbDatastore((name) => new PouchDB(name), {
        generateId: () => '1',
      })
    );
  });

  it('should trigger empty search when initialized', async () => {
    const query = { categories: [] };
    const { waitForNextUpdate } = renderHook(() =>
      useSearch(repository, query)
    );

    await waitForNextUpdate();

    expect(repository.find).toHaveBeenCalledWith({
      categories: query.categories,
    });
  });

  it('should trigger find when q is changed', async () => {
    let query: Query = { categories: [] };
    const { waitForNextUpdate, rerender } = renderHook(() =>
      useSearch(repository, query)
    );

    await waitForNextUpdate();

    await act(async () => {
      query = assoc('q', 'test', query);
      rerender();
    });

    expect(repository.find).toHaveBeenLastCalledWith({
      q: 'test',
      categories: query.categories,
    });
  });

  it('should trigger find when remote changes are received', async () => {
    let triggerChange: () => void;
    repository.remoteChanged = jest.fn().mockImplementation(() => {
      return new Observable<Document>((subscriber) => {
        triggerChange = () => subscriber.next(bu1);
      });
    });

    const query = { categories: [] };
    const { waitForNextUpdate, rerender } = renderHook(() =>
      useSearch(repository, query)
    );

    await waitForNextUpdate();

    await act(async () => {
      triggerChange();
      triggerChange();
      rerender();
    });

    expect(repository.find).toHaveBeenCalledTimes(3);
  });
});
