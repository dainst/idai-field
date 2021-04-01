import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../screens/Home';

const Stack = createStackNavigator();

const commonHeaderStyle = {
    backgroundColor: 'rgba(106,164,184,0.95)'
};

const StackNavigator = () => (
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

export default StackNavigator;
