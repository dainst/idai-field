import { renderHook } from '@testing-library/react-hooks';
import usePrevious from './use-previous';

const data1 = ['1','2','3','4'];
const data2 = ['5','6'];

describe('usePrevious', () => {

    const hook = () => renderHook(({ value }) => usePrevious(value), { initialProps: { value: data1 } });
    

    it('should return undefined on initial render', () => {
        const { result } = hook();
      
        expect(result.current).toBeUndefined();
    });

    
    it('should always return previous state after each update', () => {
        const { result, rerender } = hook();
      
        rerender({ value: data2 });
        expect(result.current).toEqual(data1);
      
        rerender({ value: [] });
        expect(result.current).toBe(data2);
      
      });

});