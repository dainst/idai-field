import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen';
import { headerBackgroundColor } from '../../constants/colors';
import { RootStackParamList } from './RootStackParamList';
import PouchDbContext from '../../data/pouchdb/pouch-context';
import SettingsScreen from '../../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const RootStackNavigator = (): JSX.Element => {

    const pouchCtx = useContext(PouchDbContext);

    return (
        <Stack.Navigator
            screenOptions={ {
                headerStyle: commonHeaderStyle,
                headerTintColor: 'white',
            } }
            initialRouteName="Settings">
            <Stack.Screen
                name="Settings"
                component={ SettingsScreen }
                options={
                    { title: 'iDAIfield mobile' }
                }
            />
            <Stack.Screen
                name="Home"
                component={ HomeScreen }
                options={ {
                    headerTitle: pouchCtx.dbName ?
                        `Connected to ${pouchCtx.dbName}` :
                        'iDAIfield mobile'
                } } />
        </Stack.Navigator>
    );
};

export default RootStackNavigator;
