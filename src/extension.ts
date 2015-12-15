'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'; 
import Controller from './controller';
import {Logger} from './logger';
import View from './view';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vsshare" is now active!'); 

	let logger = new Logger();
 	let view = new View();
 	let controller = new Controller(context, logger, view);
 
 	context.subscriptions.push(controller);
 	context.subscriptions.push(logger);
 	context.subscriptions.push(view);
 	
 	logger.activate();
 	view.activate();
 	controller.activate();	
}
