import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { headerBackgroundColor } from '../constants/colors';
import HomeStackNavigator from './HomeStackNavigator/HomeStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator/SettingsStackNavigator';

type possibleIcon = 'home' | 'home-outline' | 'list' | 'list-sharp' | undefined;

const Tab = createBottomTabNavigator();

const TabNavigator = (): JSX.Element => (
    <Tab.Navigator
        screenOptions={
            ({ route }) => ({
                tabBarIcon: function test({ focused, color, size }) {
                let iconName: possibleIcon;

                if (route.name === 'Home') {
                    iconName = focused ? 'home': 'home-outline';
                } else if (route.name === 'Settings') {
                    iconName = focused ? 'list-sharp' : 'list';
                }

                return <Ionicons name={ iconName } size={ size } color={ color } />;
                },
            })
        }
        tabBarOptions={ {
            activeTintColor: 'white',
            inactiveTintColor: 'gray',
            style: {
                backgroundColor: headerBackgroundColor
            }
        } }>
        <Tab.Screen name="Home" component={ HomeStackNavigator } />
        <Tab.Screen name="Settings" component={ SettingsStackNavigator } />
    </Tab.Navigator>
);


export default TabNavigator;