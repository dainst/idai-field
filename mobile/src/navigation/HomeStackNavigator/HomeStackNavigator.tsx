import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen';
import { headerBackgroundColor } from '../../constants/colors';
import { HomeStackParamList } from './HomeStackParamList';

const Stack = createStackNavigator<HomeStackParamList>();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const HomeStackNavigator = (): JSX.Element => (
    <Stack.Navigator
        screenOptions={ {
            headerStyle: commonHeaderStyle,
            headerTintColor: 'white',
        } }>
        <Stack.Screen
            name="Home"
            component={ HomeScreen }
            options={
                { title: 'iDAI field mobile' }
            } />
    </Stack.Navigator>
);

export default HomeStackNavigator;
