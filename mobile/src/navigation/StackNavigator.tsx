import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../screens/HomeScreen';
import { headerBackgroundColor } from '../constants/colors';

const Stack = createStackNavigator();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const StackNavigator = (): JSX.Element => (
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
);

export default StackNavigator;
