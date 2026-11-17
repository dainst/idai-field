// import { Lables } from 'idai-field-core';

import React, { useContext, useState } from 'react';
import { PreferencesContext } from '../preferences-context';
import LabelsContext from './labels-context';
import { Labels } from 'idai-field-core';

const LabelsContextProvider: React.FC = (props) => {
  const languages = useContext(PreferencesContext).preferences.languages;
  const [labels, _setLabels] = useState<Labels>(new Labels(() => languages));

  return (
    <LabelsContext.Provider value={{ labels }}>
      {props.children}
    </LabelsContext.Provider>
  );
};

export default LabelsContextProvider;
