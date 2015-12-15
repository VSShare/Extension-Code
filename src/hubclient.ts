/// <reference path="../typings/signalr/signalr.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/vsshare/vsshare.d.ts" />

'use strict';

import EditorManager from './document-manager';
import {window, Disposable} from 'vscode';
import {Logger, LogType} from './logger';
import View from './view';

var signalR = require('signalr-client');

enum SignalRStatus {
    Connecting = 0,
    Connected = 1,
    Reconnecting = 2,
    Disconnected = 4
};

export class HubClient implements Disposable {
    private _url: string;
    private _hubName: string;

    private _logger: Logger;
    private _view: View;

    private _currentStatus: SignalRStatus = SignalRStatus.Disconnected;

    private _hub: HubProxy;
    private _client: SignalR;

    private _userName: string;
    private _accessToken: string;
    private _roomName: string;
    private _roomToken: string;

    private _sessionId: string = null;

    private _isAuthorized: boolean = false;


    constructor(logger: Logger, view: View) {
        this._logger = logger;
        this._view = view;
    }

    startBroadcast(url: string, hubName: string, userName: string, accessToken: string, roomName: string, roomToken: string) {
        const self = this;

        this._url = url;
        this._hubName = hubName;

        this._client = $.hubConnection(url);
        this._hub = this._client.hub.createHubProxy(hubName);

        this._client.hub.disconnected(() => {
            window.showWarningMessage(`Disconnected connection to ${self._hubName} on ${self._hubName}`);
            self._isAuthorized = false;
        });

        this._client.hub.stateChanged((status) => {
            var oldStatus: SignalRStatus = status.oldState;
            var newStatus: SignalRStatus = status.newState;
            self._currentStatus = newStatus;
            self._logger.appendLog(`Status changed from ${oldStatus} to ${newStatus}.`, LogType.Info);

            var icon: string = "";
            switch (newStatus) {
                case SignalRStatus.Connected:
                    icon = "$(check)";
                    break;
                case SignalRStatus.Connecting:
                    icon = "$(sync)";
                    break;
                case SignalRStatus.Disconnected:
                    icon = "$(primitive-square)";
                    break;
                case SignalRStatus.Reconnecting:
                    icon = "$(sync)";
                    break;
            }

            self._view.changeStatus(SignalRStatus[newStatus]);
        });

        this._userName = userName;
        this._accessToken = accessToken;
        this._roomName = roomName;
        this._roomToken = roomToken;
        
        //接続開始
        this._client.start().done(() => {
            window.showInformationMessage(`Established connection to ${self._hubName} on ${self._hubName}`);
            // 認証
            self.sendAuthorization();
        });
    }

    private sendAuthorization() {
        const self = this;
        var data: AuthorizeBroadcasterRequest = { "user_name": this._userName, "access_token": this._accessToken, "room_name": this._roomName, "room_token": this._roomToken };
        this._hub.invoke("Authorize", JSON.stringify(data)).done((response) => {
            var result: AuthorizeBroadcasterResponse = JSON.parse(response);
            if (result != null && result.success) {
                self._isAuthorized = true;
                let message = `Authentication success.(User: ${self._userName}) Now, Broadcasting to ${self._roomName}`;
                self._logger.appendLog(message, LogType.Info);
                window.showInformationMessage(message);
                this._sessionId = null;
                self.registerSession();
            }
        }).fail((error) => {
            let message = `Authentication failed.(User: ${self._userName}, Room: ${self._roomName})`;
            self._logger.appendLog(`${message}, Error: ${error}`, LogType.Error);
            window.showErrorMessage(message);
        });
    }

    private registerSession() {
        const self = this;

        var data: AppendSessionRequest = { "filename": "", "type": ContentType.PlainText };
        this._hub.invoke("AppendSession", JSON.stringify(data)).done((response) => {
            var result: AppendSessionResponse = JSON.parse(response);
            if (result != null && result.success) {
                self._sessionId = result.id;
                let message = `Registered session.(Session Id: ${self._sessionId})`;
                self._logger.appendLog(message, LogType.Info);
            }
        }).fail((error) => {
            self._logger.appendLog(`Failed to register session. ${error}`, LogType.Error);
        });
    }

    private removeSession() {
        if (!this._sessionId)
            return;

        const self = this;

        var data: RemoveSessionRequest = { "id": this._sessionId };
        this._hub.invoke("RemoveSession", JSON.stringify(data)).done(() => {
            self._sessionId = null;
            let message = `Removed session.(Session Id: ${self._sessionId})`;
            self._logger.appendLog(message, LogType.Info);
        }).fail((error) => {
            self._logger.appendLog(`Failed to remove session. ${error}`, LogType.Error);
        });
    }

    stopBroadcast() {
        this._client.stop();
    }

    updateSessionContent(item: UpdateContentData[]) {
        if (!this._isAuthorized || !this._sessionId)
            return;

        var request: UpdateSessionContentRequest = { "id": this._sessionId, "data": item };
        const self = this;

        this._hub.invoke("UpdateSessionContent", JSON.stringify(request)).fail((error) => {
            self._logger.appendLog(`Failed to update session content. ${error}`, LogType.Error);
        });
    }

    updateSessionInfo(filename: string, type: ContentType) {
        if (!this._isAuthorized || !this._sessionId)
            return;

        var request: UpdateSessionInfoRequest = { "id": this._sessionId, "filename": filename, "type": type };
        const self = this;

        this._hub.invoke("UpdateSessionInfo", JSON.stringify(request)).fail((error) => {
            self._logger.appendLog(`Failed to update session info. ${error}`, LogType.Error);
        });
    }

    updateSessionCursor(anchor: CursorPosition, active: CursorPosition, type: CursorType) {
        if (!this._isAuthorized || !this._sessionId)
            return;

        var request: UpdateSessionCursorRequest = { "id": this._sessionId, "anchor": anchor, "active": active, "type": type };
        const self = this;

        this._hub.invoke("UpdateSessionCursor", JSON.stringify(request)).fail((error) => {
            self._logger.appendLog(`Failed to update session cursor. ${error}`, LogType.Error);
        });
    }

    getStatus(): SignalRStatus {
        return this._currentStatus;
    }

    dispose() {
        this._client.stop();
    }

}