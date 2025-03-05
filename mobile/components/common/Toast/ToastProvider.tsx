import React, { createContext, useState } from 'react';

export enum ToastType {
  Info = 'INFO',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

type ToastConfigType = { type: ToastType; message: string; duration: number };


export type ToastContextType = {
  toastConfig: ToastConfigType | null;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: () => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC = ({ children }) => {

	const [toastConfig, setToastConfig ] = useState<ToastConfigType | null>(null);


	const showToast = (type: ToastType, message: string, duration = 3000) =>
		setToastConfig({ type, message, duration });


	const hideToast = () => setToastConfig(null);


	return (
	<ToastContext.Provider value={ { toastConfig, showToast, hideToast } }>
		{children}
	</ToastContext.Provider>
	);
};