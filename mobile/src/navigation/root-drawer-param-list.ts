import { NavigatorScreenParams } from '@react-navigation/core';
import { DocumentsStackParamList } from '../screens/DocumentsScreen';

type RootDrawerParamList = {
    Documents: NavigatorScreenParams<DocumentsStackParamList>;
};

export default RootDrawerParamList;
