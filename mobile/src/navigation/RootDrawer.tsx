import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text } from 'native-base';
import React from 'react';
import { DocumentRepository } from '../repositories/document-repository';
import HomeScreen from '../screens/Home/HomeScreen';
import RootDrawerParamList from './root-drawer-param-list';


const Drawer = createDrawerNavigator<RootDrawerParamList>();


interface RootDrawerProps {
    repository: DocumentRepository;
}


const RootDrawer: React.FC<RootDrawerProps> = ({ repository }) => {
    return (
        <Drawer.Navigator drawerContent={ () => <Text>Test</Text> }>
            <Drawer.Screen name="Home">
                { (props) => <HomeScreen { ...props } repository={ repository } /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};
export default RootDrawer;
