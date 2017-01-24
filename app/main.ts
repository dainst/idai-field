/// <reference path="../config/config.d.ts" />

import {enableProdMode} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

import CONFIG = require("config/config.json!json");

if (CONFIG['environment'] == 'production') enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);