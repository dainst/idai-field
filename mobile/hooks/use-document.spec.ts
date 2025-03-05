import { renderHook } from '@testing-library/react-hooks';
import { DocumentRepository } from '@/repositories/document-repository';
import { t2 } from '../test_data/test_docs/t2';
import useDocument from './use-document';

jest.mock('../repositories/document-repository');

describe('useDocument',() => {

    let repo: DocumentRepository;

    beforeEach(async() => {
        // ignore typescript here. Because mocked Doc repo does not require arguments for init method
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        repo = await DocumentRepository.init();
    });

    it('should return document with resource.id from prop docId',async() => {
        
        const { result, waitForNextUpdate } = renderHook(() => useDocument(repo,t2.resource.id));
        await waitForNextUpdate();

        expect(result.current).toEqual(t2);
    });

    it('should set return undefined if no document is found',async() => {

        jest.spyOn(console, 'error').mockImplementation(jest.fn());
        
        const { result, waitForNextUpdate, rerender } =
            renderHook(({ docId }) => useDocument(repo,docId), { initialProps: { docId: t2.resource.id } });
        await waitForNextUpdate();

        rerender({ docId: 'data2' });
        await waitForNextUpdate();


        expect(result.current).toBeUndefined();
    });
});