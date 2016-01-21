import {Injectable} from "angular2/core";
var uuid = require('node-uuid');

export class IdGenerator {

    static generateId():string {
        return uuid.v4();
    }

}