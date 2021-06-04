import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Animated } from 'react-native';
import { ACircle, GeoElementsCommonProps } from '../common-props';
import { GeoPoint } from './GeoPoint';

const props: GeoElementsCommonProps = {
    coordinates: [2,2],
    zoom: new Animated.Value(1)
};

configure({ adapter: new Adapter() });

describe('<GeoPoint />', () => {
    let wrapper: any;
    beforeAll(() => {
        wrapper = shallow(
            <GeoPoint { ...props } />);
    });

    it('Renders one SVG circle child', () => {
        
        expect(wrapper.find(ACircle)).toHaveLength(1);
    });

    it('applies the the transformation function correctly', () => {

        expect(wrapper.find(ACircle).prop('cx')).toBe(2);
        expect(wrapper.find(ACircle).prop('cy')).toBe(2);
    });
});