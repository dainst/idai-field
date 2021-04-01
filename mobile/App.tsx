import React, { ReactElement } from 'react';
import { enableScreens } from 'react-native-screens';
import StackNavigator from './navigation/StackNavigator';


enableScreens();

export default function App(): ReactElement {
  return (
      <StackNavigator />
  );
}

