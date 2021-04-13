import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
    Settings: undefined
    Home: undefined
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
    navigation: StackNavigationProp<RootStackParamList, T>;
    route: RouteProp<RootStackParamList, T>;
};