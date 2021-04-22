import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { DocumentRepository } from '../repositories/document-repository';
import HomeScreen from '../screens/Home/HomeScreen';
import RootDrawerParamList from './root-drawer-param-list';


const Drawer = createDrawerNavigator<RootDrawerParamList>();


interface RootDrawerProps {
    repository: DocumentRepository;
}


const RootDrawer: React.FC<RootDrawerProps> = ({ repository }) => {

    const [documents, issueSearch] = useSearch(repository);

    return (
        <Drawer.Navigator drawerContent={ () => <DrawerContent documents={ documents } /> }>
            <Drawer.Screen name="Home">
                { (props) => <HomeScreen { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ issueSearch } /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};
export default RootDrawer;
