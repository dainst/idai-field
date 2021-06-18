import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useToast from '../../../hooks/use-toast';
import { colors } from '../../../utils/colors';
import { ToastType } from './ToastProvider';

const fadeDuration = 300;
const tabBarHeight = 60;

export const Toast: React.FC = () => {

	const insets = useSafeAreaInsets();
	const { toastConfig, hideToast } = useToast();
	const opacity = React.useRef(new Animated.Value(0)).current;

	
	const fadeIn = React.useCallback(() => {
		Animated.timing(opacity, {
			toValue: 1,
			duration: fadeDuration,
			useNativeDriver: true,
		}).start();
	}, [opacity]);


	const fadeOut = React.useCallback(() => {
		Animated.timing(opacity, {
			toValue: 0,
			duration: fadeDuration,
			useNativeDriver: true,
		}).start(() => {
			hideToast();
		});
	}, [opacity, hideToast]);


	useEffect(() => {

		
		if (!toastConfig) return;

		fadeIn();
		const timer = setTimeout(fadeOut, toastConfig.duration);

		return () => clearTimeout(timer);
	}, [toastConfig, fadeIn, fadeOut]);

	
	if (!toastConfig) return null;

	const { type, message } = toastConfig;
	let backgroundColor;
	switch (type) {
		case ToastType.Info:
			backgroundColor = colors.primary;
			break;
		case ToastType.Error:
			backgroundColor = colors.danger;
			break;
		case ToastType.Success:
			backgroundColor = colors.success;
			break;
	}

	return (
		<Animated.View
			style={ [
			styles.container,
			{ bottom: insets.bottom + tabBarHeight, opacity },
			] }
		>
			<View style={ [styles.toast, { backgroundColor }] }>
				<Text style={ styles.message }>{message}</Text>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'absolute',
    marginHorizontal: 20,
    maxWidth: 480,
  },
  toast: {
    borderRadius: 6,
    padding: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.secondary,
  },
});
