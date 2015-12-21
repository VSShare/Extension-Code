# VSShare
VSShare broadcast extension for Visual Studio Code.  
It can share the content which Visual Studio Code opens in real-time using SignalR.  
To use this extension, you also need to use broadcast server.  
You can register [vsshare.net](https://vsshare.net/) or host it yourself with [this project](https://github.com/VSShare/VSShare-Server).

# Usage
_Japanese documents are also available [here](https://vsshare.net/Documents/)_

1. Setup broadcast server to get broadcast settings. (`UserName`,`UserToken`,`RoomName`,`RoomToken` is required).
2. Install this extension.
3. Setup user settings with the above-mentioned values.For example,
```json
{
	// Specify the username of your VSShare server account
	"vsshare.userName": "UserName",
	// Specify the access token of your VSShare server account
	"vsshare.userToken": "UserToken",
	// Specify the room name for your broadcast target of VSShare server
	"vsshare.roomName": "RoomName",
	// Specify the room token for your broadcast target of VSShare server
	"vsshare.roomToken": "RoomToken"
}
```

4. In command pallet, `[Start Broadcasting]` to start broadcasting.
5. To stop broadcasting, use `[Stop Broadcasting]` command in command pallet.


* **Note**: To see connection logs, use `[Show Broadcasting Log Window]` to show these information.
* **Note**: If you are using your own hosting VSShare-Server, you must set the following field to UserSettings.
```json
{
	// Specify the hub name of your VSShare server
	"vsshare.hubName": "broadcast",
	// Specify the url of your VSShare server
	"vsshare.url": "http://vsshare.net/signalr"
}
```

* **Note**: If you are using your own hosting VSShare-Server and you want to debug the connection, you should set the following value to UserSettings.
```json
{
	// [For Server Developer]: Specify log level to show log window.(0: Debug, 1:Info, 2:Warn, 3:Error)
	"vsshare.logLevel": 0	
}
```

# Install
You can install with `[Extension: Install Extension]` command to install the latest build extension.  

You can also clone this project to build your own.  
To build this extension, you should run the commands as follows,
```sh
git clone https://github.com/VSShare/Extension-Code.git
cd Extension-Code
npm install
```
Then, open this directory with Visual Studio Code, and you can build and debug the extension.

# License
[MIT LICENSE](https://github.com/VSShare/Extension-Code/blob/master/LICENSE)

