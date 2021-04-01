import React, { CSSProperties, ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import Home from './screens/Home';

const Stack = createStackNavigator();

enableScreens();

export default function App(): ReactElement {
  return (
    <NavigationContainer>
        <Stack.Navigator
            screenOptions={ {
                headerStyle: commonHeaderStyle,
                headerTintColor: 'white',
            } }>
            <Stack.Screen
                name="Home"
                component={ Home }
                options={
                    { title: 'iDAI field mobile' }
                } />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

const commonHeaderStyle = {
    backgroundColor: 'rgba(106,164,184,0.95)'
};