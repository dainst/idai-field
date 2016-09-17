import {Component, OnInit, Inject, ViewChild, TemplateRef} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {ObjectList} from "./object-list";
import {Messages} from "idai-components-2/idai-components-2";
import {M} from "../m";
import {DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import {Validator} from "../model/validator";
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {PersistenceService} from "./persistence-service";

@Component({
    moduleId: module.id,
    template: `<h1>Overview home</h1>`
})

/**
 */
export class OverviewHomeComponent implements OnInit {}
