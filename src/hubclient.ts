/// <reference path="../typings/vsshare/typings/vsshare/vsshare.d.ts" />

'use strict';

import DocumentManager from './document-manager';
import {window, Disposable} from 'vscode';
import {Logger, LogType} from './logger';
import View from './view';
import Controller from './controller';

var signalR = require('signalr-client');

enum SignalRStatus {
    Connecting = 0,
    SignIn = 1,
    Connected = 2,
    Reconnecting = 3,
    Disconnected = 4
};

export class HubClient implements Disposable {
    private _url: string;
    private _hubName: string;

    private _logger: Logger;
    private _view: View;
    private _controller: Controller;

    private _currentStatus: SignalRStatus = SignalRStatus.Disconnected;

    private _client;

    private _userName: string;
    private _accessToken: string;
    private _roomName: string;
    private _roomToken: string;

    private _sessionId: string = null;

    private _isAuthorized: boolean = false;

    constructor(logger: Logger, view: View, controller: Controller) {
        this._logger = logger;
        this._view = view;
        this._controller = controller;
    }
    
    activate() {
        this.changeBroadcastStatus(SignalRStatus.Disconnected);
    }

    isConnected() {
        return (this._client != null);
    }

    startBroadcast(url: string, hubName: string, userName: string, accessToken: string, roomName: string, roomToken: string) {
        const self = this;

        this._url = url;
        this._hubName = hubName;
        self.changeBroadcastStatus(SignalRStatus.Connecting);

        var signalR = require('signalr-client');

        this._client = new signalR.client(url, [hubName], 10, true);

        this._client.serviceHandlers = {
            bound: () => { console.log("Websocket bound"); },
            connectFailed: (error) => {
                let message = `Failed to etablish connection to ${self._hubName} on ${self._hubName}`;
                window.showErrorMessage(message);
                self._logger.appendLog(message, LogType.Error);

                self.disposeConnection();
            },
            connected: (connection) => {
                let message = `Established connection to ${self._hubName} on ${self._hubName}`;
                window.showInformationMessage(message);
                self._logger.appendLog(message, LogType.Info);
                self.changeBroadcastStatus(SignalRStatus.SignIn);

                self.sendAuthorization();
            },
            disconnected: () => {
                let message = `Disconnected connection to ${self._hubName} on ${self._hubName}`;
                window.showInformationMessage(message);
                self._logger.appendLog(message, LogType.Info);

                self.disposeConnection();
            },
            onerror: (error) => {
                let message = `An error has occured on WebSocket. ${error}`;
                self._logger.appendLog(message, LogType.Debug);
            },
            messageReceived: (message) => {
                self._logger.appendLog(`Received message on WebSocket. ${message}`, LogType.Debug);
                return false;
            },
            bindingError: (error) => {
                self._logger.appendLog(`Binding error on WebSocket. ${error}`, LogType.Debug);
            },
            onUnauthorized: (res) => {
                self._logger.appendLog(`OnUnauthorized on WebSocket. ${res}`, LogType.Debug);
            },
            connectionLost: (error) => {
                self._logger.appendLog(`Connection lost on WebSocket. ${error}`, LogType.Debug);
            },
            reconnected: (connection) => {
                self._logger.appendLog("Reconnected", LogType.Info);

                self.changeBroadcastStatus(SignalRStatus.Connected);
            },
            reconnecting: (retry /* { inital: true/false, count: 0} */) => {
                self._logger.appendLog("Reconnecting...", LogType.Info);

                self.changeBroadcastStatus(SignalRStatus.Reconnecting);
                return retry.count >= 3; /* cancel retry true */
            }
        };

        this._userName = userName;
        this._accessToken = accessToken;
        this._roomName = roomName;
        this._roomToken = roomToken;
        
        //接続開始
        this._client.start();
    }

    private changeBroadcastStatus(status: SignalRStatus) {
        var message: string = "";
        switch (status) {
            case SignalRStatus.Connected:
                message = "$(check) Connected";
                break;
            case SignalRStatus.SignIn:
                message = "$(sign-in) Signing-in";
                break;
            case SignalRStatus.Connecting:
                message = "$(sync) Connecting";
                break;
            case SignalRStatus.Disconnected:
                message = "$(primitive-square) Disconnected";
                break;
            case SignalRStatus.Reconnecting:
                message = "$(sync) Reconnecting";
                break;
        }
        this._view.changeStatus(message);
    }

    private sendAuthorization() {
        const self = this;
        var data: AuthorizeBroadcasterRequest = { "user_name": this._userName, "access_token": this._accessToken, "room_name": this._roomName, "room_token": this._roomToken };
        this._client.call(this._hubName, "Authorize", data).done((err, res) => {
            var result: AuthorizeBroadcasterResponse = res;
            if (result != null && result.success) {
                self._isAuthorized = true;
                let message = `Authentication success.(User: ${self._userName}) Now, Broadcasting to ${self._roomName}`;
                self._logger.appendLog(message, LogType.Info);
                window.showInformationMessage(message);

                self._sessionId = null;

                self.registerSession();
            } else {
                let message = `Authentication failed.(User: ${self._userName})`;
                self._logger.appendLog(message, LogType.Error);
                window.showErrorMessage(message);
                self.disposeConnection();
            }
        }).fail((err) => {
            let message = `Authentication failed.(User: ${self._userName})`;
            self._logger.appendLog(message, LogType.Error);
            window.showErrorMessage(message);
            self.disposeConnection();
        });
    }

    private registerSession() {
        const self = this;

        var data: AppendSessionRequest = { "filename": "", "type": "" };
        this._client.call(this._hubName, "AppendSession", data).done((err, response) => {
            var result: AppendSessionResponse = response;
            if (result != null && result.success) {
                self._sessionId = result.id;
                let message = `Registered session.(Session Id: ${self._sessionId})`;
                self._logger.appendLog(message, LogType.Info);
                self.changeBroadcastStatus(SignalRStatus.Connected);
                self._controller.refreshBroadcast();
            }
        });
    }

    private removeSession() {
        if (!this._sessionId) return;

        const self = this;

        var data: RemoveSessionRequest = { "id": this._sessionId };
        this._client.call(this._hubName, "RemoveSession", data).done(() => {
            self._sessionId = null;
            let message = `Removed session.(Session Id: ${self._sessionId})`;
            self._logger.appendLog(message, LogType.Info);
        });
    }

    private disposeConnection() {
        this._isAuthorized = false;
        this._sessionId = null;
        this.changeBroadcastStatus(SignalRStatus.Disconnected);
        if (this._client != null) {
            this._client.end();
            this._client = null;
        }
    }

    stopBroadcast() {
        this.disposeConnection();
    }

    updateSessionContent(item: UpdateContentData[]) {
        if (!this._isAuthorized || !this._sessionId) return;

        var request: UpdateSessionContentRequest = { "id": this._sessionId, "data": item };
        const self = this;

        this._client.call(this._hubName, "UpdateSessionContent", request);
    }

    updateSessionInfo(filename: string, type: string) {
        if (!this._isAuthorized || !this._sessionId) return;

        var request: UpdateSessionInfoRequest = { "id": this._sessionId, "filename": filename, "type": type };
        const self = this;

        this._client.call(this._hubName, "UpdateSessionInfo", request);
    }

    updateSessionCursor(anchor: CursorPosition, active: CursorPosition, type: CursorType) {
        if (!this._isAuthorized || !this._sessionId) return;

        var request: UpdateSessionCursorRequest = { "id": this._sessionId, "anchor": anchor, "active": active, "type": type };
        const self = this;

        this._client.call(this._hubName, "UpdateSessionCursor", request);
    }

    getStatus(): SignalRStatus {
        return this._currentStatus;
    }

    dispose() {
        this._client.stop();
    }
}
