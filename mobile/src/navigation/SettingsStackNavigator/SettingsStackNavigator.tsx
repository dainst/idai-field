import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { headerBackgroundColor } from '../../constants/colors';
import { SettingsStackParamList } from './SettingsStackParamList';
import SettingsScreen from '../../screens/SettingsScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const SettingsStackNavigator = (): JSX.Element => (
    <Stack.Navigator
        screenOptions={ {
            headerStyle: commonHeaderStyle,
            headerTintColor: 'white',
        } }>
        <Stack.Screen
            name="Settings"
            component={ SettingsScreen }
            options={
                { title: 'iDAI field mobile' }
            } />
    </Stack.Navigator>
);

export default SettingsStackNavigator;
