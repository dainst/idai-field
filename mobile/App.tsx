import React, { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import Home from './screens/Home';

const Stack = createStackNavigator();

enableScreens();

export default function App(): ReactElement {
  return (
      <NavigationContainer>
          <Stack.Navigator>
              <Stack.Screen name="Home" component={ Home } />
          </Stack.Navigator>
      </NavigationContainer>
  );
}

