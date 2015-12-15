'use strict';

import * as vscode from 'vscode';

export enum LogType {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

export class Logger implements vscode.Disposable {
    private _channel: vscode.OutputChannel;
    private _logLevel: number;

    static ChannelName: string = "VSShareLogWindow";

    constructor(logLevel: number) {
        this._logLevel = logLevel;
    }

    activate() {
        // Windowを作成
        this._channel = vscode.window.createOutputChannel(Logger.ChannelName);
        this._channel.clear();
    }

    appendLog(message: string, type: LogType) {
        if (type < this._logLevel) return;

        let formattedMessage = `[${LogType[type]}] ${Date.now().toLocaleString()}: ${message}`;
        this._channel.appendLine(formattedMessage);
    }

    hideWindow() {
        this._channel.hide();
    }

    showWindow() {
        this._channel.show();
    }

    clearWindow() {
        this._channel.clear();
    }

    dispose() {
        this._channel.dispose();
    }
}