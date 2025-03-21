import { useWindowDimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

const useOrientation = (): Orientation => {

    const dimensions = useWindowDimensions();

    return (dimensions.width > dimensions.height) ? 'landscape' : 'portrait';
};

export default useOrientation;
