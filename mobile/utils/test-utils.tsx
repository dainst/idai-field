import { render, RenderAPI, RenderOptions } from '@testing-library/react-native';
import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';


function MockProviders({ children }: { children: ReactNode }) {
    return (
        <SafeAreaProvider
                initialMetrics={ {
                    frame: { x: 0, y: 0, width: 0, height: 0 },
                    insets: { top: 0, left: 0, right: 0, bottom: 0 },
                } }
            >
            { children }
        </SafeAreaProvider>
    );
}

const customRender = (ui: React.ReactElement<unknown>, options?: RenderOptions): RenderAPI =>
    render(ui, { wrapper: MockProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
