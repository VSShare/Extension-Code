'use strict';

import * as vscode from 'vscode';

export enum LogType {
    Info,
    Warn,
    Error
}

export class Logger implements vscode.Disposable {
    private _channel: vscode.OutputChannel;

    static ChannelName: string = "VSShareLogWindow";

    activate() {
        // Windowを作成
        this._channel = vscode.window.createOutputChannel(Logger.ChannelName);
        this._channel.clear();
    }

    appendLog(message: string, type: LogType) {
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