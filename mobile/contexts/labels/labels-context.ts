import { Labels } from 'idai-field-core';
import React from 'react';

interface Context {
  labels: Labels | undefined;
}

const LabelsContext = React.createContext<Context>({
  labels: undefined,
});

export default LabelsContext;
