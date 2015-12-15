// Type definitions for VSShare Protocol
// Project: http://github.com/VSShare/
// Definitions by: Yuki Igarashi <https://github.com/bonprosoft/>

interface AuthorizeBroadcasterRequest {
	user_name: string;
	access_token: string;
	room_name: string;
	room_token: string;
}

interface AuthorizeBroadcasterResponse {
	success: boolean;
}

declare const enum ContentType {
	PlainText = 0,
	CSharp = 1,
	VB_NET = 2,
	XML = 3,
	JSON = 4
}

interface AppendSessionRequest {
	filename: string;
	type: ContentType;
}

interface AppendSessionResponse {
	id: string;
	success: boolean;
}

interface SessionRequestBase {
	id: string;
}

interface RemoveSessionRequest extends SessionRequestBase {
}

interface UpdateSessionContentRequest extends SessionRequestBase {
	data: UpdateContentData[]
}

interface UpdateContentData {
	data: Line[],
	type: UpdateType,
	pos: number,
	len: number,
	order: number
}

interface Line {
	text: string;
	modified: boolean;
}

declare const enum UpdateType {
	Insert = 0,
	Delete = 1,
	Replace = 2,
	Append = 3,
	RemoveMarker = 4,
	ResetAll = 5
}

interface UpdateSessionCursorRequest extends SessionRequestBase {
	anchor: CursorPosition,
	active: CursorPosition,
	type: CursorType
}

interface CursorPosition {
	line: number;
	pos: number;
}

declare const enum CursorType {
	Point = 0,
	Select = 1
}

interface UpdateSessionInfoRequest extends SessionRequestBase {
	filename: string;
	type: ContentType;
}
