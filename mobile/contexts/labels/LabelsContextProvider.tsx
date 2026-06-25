import React, { ReactNode, useContext, useMemo } from 'react';
import { PreferencesContext } from '../preferences-context';
import LabelsContext from './labels-context';
import { Labels } from 'idai-field-core';

const LabelsContextProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const languages = useContext(PreferencesContext).preferences.languages;
  const labels = useMemo(() => new Labels(() => languages), [languages]);

  return (
    <LabelsContext.Provider value={{ labels }}>
      {props.children}
    </LabelsContext.Provider>
  );
};

export default LabelsContextProvider;
