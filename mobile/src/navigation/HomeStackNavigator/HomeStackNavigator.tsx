import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen';
import { headerBackgroundColor } from '../../constants/colors';
import { HomeStackParamList } from './HomeStackParamList';
import PouchDbContext from '../../data/pouchdb/pouch-context';

const Stack = createStackNavigator<HomeStackParamList>();

const commonHeaderStyle = {
    backgroundColor: headerBackgroundColor
};

const HomeStackNavigator = (): JSX.Element => {

    const pouchCtx = useContext(PouchDbContext);

    return (
        <Stack.Navigator
            screenOptions={ {
                headerStyle: commonHeaderStyle,
                headerTintColor: 'white',
            } }>
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

export default HomeStackNavigator;
