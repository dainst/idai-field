import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Circle } from 'react-native-svg';
import { GeoElementsCommonProps } from '../common-props';
import { GeoPoint } from './GeoPoint';

const props: GeoElementsCommonProps = {
    csTransformFunction: (pos) => [pos[0] * 4, pos[1] + 5],
    coordinates: [2,2],
};

configure({ adapter: new Adapter() });

describe('<GeoPoint />', () => {
    let wrapper: any;
    beforeAll(() => {
        wrapper = shallow(
            <GeoPoint { ...props } />);
    });

    it('Renders one SVG circle child', () => {
        
        expect(wrapper.find(Circle)).toHaveLength(1);
    });

    it('applies the the transformation function correctly', () => {

        expect(wrapper.find(Circle).prop('cx')).toBe(8);
        expect(wrapper.find(Circle).prop('cy')).toBe(7);
    });
});