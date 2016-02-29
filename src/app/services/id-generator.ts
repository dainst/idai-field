import {Injectable} from "angular2/core";
import {UUID} from "angular2-uuid/index";

export class IdGenerator {
    static generateId():string {
        return UUID.UUID();
    }
}