import React from 'react';
import { View, ViewProps } from 'react-native';

type BarCodePoint = {
    x: number;
    y: number;
};

  
type BarCodeSize = {
    height: number;
    width: number;
};
  
type BarCodeBounds = {
    origin: BarCodePoint;
    size: BarCodeSize;
};

type BarCodeScannerResult = {
    type: string;
    data: string;
    bounds?: BarCodeBounds;
    cornerPoints?: BarCodePoint[];
};

type BarCodeEvent = BarCodeScannerResult & {
    target?: number;
};

type BarCodeScannedCallback = (params: BarCodeEvent) => void;

export interface BarCodeScannerProps extends ViewProps {
    type?: 'front' | 'back' | number;
    barCodeTypes?: string[];
    onBarCodeScanned?: BarCodeScannedCallback;
}

export class BarCodeScanner extends React.Component<BarCodeScannerProps> {

    static requestPermissionsAsync = jest.fn((): Promise<{status: string}> => {
        return new Promise((resolve, _reject) => {
            setTimeout(() => resolve({ status: 'granted' }),50);
        });
    });

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    render() {
        return (<View></View>);
    }

}

export const { requestPermissionsAsync } = BarCodeScanner;