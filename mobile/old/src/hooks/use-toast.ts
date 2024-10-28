import { useContext } from 'react';
import { ToastContext, ToastContextType } from '../components/common/Toast/ToastProvider';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const useToast = (): ToastContextType => useContext(ToastContext)!;


export default useToast;