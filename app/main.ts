/// <reference path="../config/config.d.ts" />

import {enableProdMode} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

const CONFIG = require('electron').remote.getGlobal('config');

if (CONFIG['environment'] == 'production') enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);