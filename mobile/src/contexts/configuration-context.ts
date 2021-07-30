import { ProjectConfiguration } from 'idai-field-core';
import React from 'react';

const defaultConfig = new ProjectConfiguration([[], []]);

export const ConfigurationContext = React.createContext<ProjectConfiguration>(defaultConfig);
