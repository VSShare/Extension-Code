'use strict';

import {HubClient} from './hubclient';
import * as vscode from 'vscode';

export default class View implements vscode.Disposable {
    private _statusBarItem: vscode.StatusBarItem;

    constructor() {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
    }

    changeStatus(status: string) {
        this._statusBarItem.text = status;
        this._statusBarItem.show();
    }

    activate() {

    }

    dispose() {
        this._statusBarItem.dispose();
    }

}