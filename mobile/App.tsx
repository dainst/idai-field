import React, { ReactElement } from 'react';
import { enableScreens } from 'react-native-screens';
import StackNavigator from './navigation/StackNavigator';
import { Provider as PaperProvider } from 'react-native-paper';

enableScreens();

export default function App(): ReactElement {
  return (
    <PaperProvider>
        <StackNavigator />
    </PaperProvider>
  );
}

