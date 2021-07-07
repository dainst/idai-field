import React from 'react';
import { render } from '@testing-library/react';
import DocumentDetails from './DocumentDetails';
import { BrowserRouter as Router } from 'react-router-dom';


test('abc', () => {

    const document = {
        resource: {
            category: 'Operation',
            id: '1',
            identifier: '1dentifier',
            shortDescription: 'abcd',
            groups: [],
            relations: []
        }
    } as any;

    const { getByText } = render(<Router><DocumentDetails document={ document } /></Router>);
    const linkElement = getByText(/1dentifier/i);
    expect(linkElement).toBeInTheDocument();
});
