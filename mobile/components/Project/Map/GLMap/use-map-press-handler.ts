import { MutableRefObject } from 'react';
import { GestureResponderEvent, LayoutRectangle } from 'react-native';
import { Camera, Raycaster, Scene, Vector2 } from 'three';
import { LONG_PRESS_DURATION_MS } from './constants';

interface ReturnHandler {
    onPress: (e:GestureResponderEvent) => void,
    onTouchEnd: () => void
}

const useMapPressHandler = (
        setHighlightedDocId: (docId: string) => void,
        highlightedDocId: string | undefined,
        selectParentId: (docId: string) => void,
        screen: LayoutRectangle,
        camera: Camera,
        scene: Scene,
        pressStartTime: MutableRefObject<number>): ReturnHandler => {

    const screenToNormalizedDeviceCoordinates = (x: number, y: number) =>
        new Vector2(
            (x / screen.width ) * 2 - 1,
            -(y / screen.height) * 2 + 1);

    const onPress = (e: GestureResponderEvent) => {

        const ndc_vec = screenToNormalizedDeviceCoordinates(e.nativeEvent.locationX, e.nativeEvent.locationY);
        const raycaster = new Raycaster();
        raycaster.setFromCamera(ndc_vec, camera);
        const intersections = raycaster.intersectObjects(scene.children,true);
        pressStartTime.current = performance.now();
        // filter objects to be selected and sort by renderOrder in descending order
        const filteredSortedInters = intersections
            .filter(intersection => intersection.object.parent?.userData['isSelected'])
            .sort((a,b) => {
                const aOrder = a.object.renderOrder;
                const bOrder = b.object.renderOrder;
                return (aOrder < bOrder) ? 1 : (aOrder > bOrder) ? -1 : 0;
            });
        if(filteredSortedInters.length){
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const docId = filteredSortedInters[0].object.parent!.uuid;
            setHighlightedDocId(docId);
        }
    };

    const onTouchEnd = () => {

        if( performance.now() - pressStartTime.current > LONG_PRESS_DURATION_MS && highlightedDocId)
            selectParentId(highlightedDocId);
    };

    return { onPress, onTouchEnd };

};

export default useMapPressHandler;