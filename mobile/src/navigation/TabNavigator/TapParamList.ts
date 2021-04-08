import { RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type TapParamList = {
    Home: undefined
    Settings: undefined
};

export type TapStackNavProps<T extends keyof TapParamList> = {
    navigation: BottomTabNavigationProp<TapParamList, T>;
    route: RouteProp<TapParamList, T>;
};