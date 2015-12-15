'use strict';

import * as vscode from 'vscode'
import * as events from 'events';
import {Logger} from './logger';
import {HubClient} from './hubclient';
import View from './view';
import DocumentManager from './document-manager';

export default class Controller implements vscode.Disposable {

	private _logger: Logger;
	private _view: View;
	private _documentManager: DocumentManager;

	private _extensionContext: vscode.ExtensionContext;
	private _eventEmitter: events.EventEmitter = new events.EventEmitter();
	private _hubClient: HubClient;
	private _config: vscode.WorkspaceConfiguration;

	static StartBroadcastCommand: string = "vsshare.startBroadcast";
	static StopBroadcastCommand: string = "vsshare.stopBroadcast";
	static RestartBroadcastCommand: string = "vsshare.restartBroadcast";
	static RefreshBroadcastCommand: string = "vsshare.refreshBroadcast";
	static ShowLogWindowCommand: string = "vsshare.showLogWindow";

	static DefaultEndpointUrl: string = "http://vsshare.net/signalr";
	static DefaultHubName: string = "broadcast";

	private registerCommand(command: string) {
		const self = this;
		this._extensionContext.subscriptions.push(vscode.commands.registerCommand(command, () => {
			self._eventEmitter.emit(command);
		}));
	}

	private startBroadcast() {
		var endpointUrl = this._config['url'] || Controller.DefaultEndpointUrl;
		var hubName = this._config['hubName'] || Controller.DefaultHubName;

		var userName: string = this._config['userName'] || null;
		var userToken: string = this._config['userToken'] || null;
		var roomName: string = this._config['roomName'] || null;
		var roomToken: string = this._config['roomToken'] || null;

		if (!userName || !userToken || !roomName || !roomToken) {
			vscode.window.showErrorMessage('You need to set preference field before using VSShare.');
			return;
		}

		this._hubClient.startBroadcast(endpointUrl, hubName, userName, userToken, roomName, roomToken);
	}

	private stopBroadcast() {
		this._hubClient.stopBroadcast();
	}

	constructor(context: vscode.ExtensionContext, logger: Logger, view: View) {
		this._extensionContext = context;
		this._logger = logger;
		this._view = view;
	}

	activate() {
		const self = this;
		this._config = vscode.workspace.getConfiguration('vscode');

		this._hubClient = new HubClient(this._logger, this._view);
		this._documentManager = new DocumentManager(this._hubClient, this._logger);
		this._documentManager.active();

		this.registerCommand(Controller.StartBroadcastCommand);
		this.registerCommand(Controller.StopBroadcastCommand);
		this.registerCommand(Controller.RestartBroadcastCommand);
		this.registerCommand(Controller.RefreshBroadcastCommand);
		this.registerCommand(Controller.ShowLogWindowCommand);

		this._eventEmitter.on(Controller.StartBroadcastCommand, () => { self.startBroadcast(); });
		this._eventEmitter.on(Controller.StopBroadcastCommand, () => { self.stopBroadcast(); });
		this._eventEmitter.on(Controller.RestartBroadcastCommand, () => { self.stopBroadcast(); self.startBroadcast(); });
		this._eventEmitter.on(Controller.RefreshBroadcastCommand, () => { self._documentManager.resendActiveDocument(); });
		this._eventEmitter.on(Controller.ShowLogWindowCommand, () => { self._logger.showWindow(); });
	}

	dispose() {
		this._hubClient.dispose();
		this._documentManager.dispose();
	}
}

