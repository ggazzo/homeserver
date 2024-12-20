import { createEventBase, type EventBase } from "./eventBase";
import { createEventWithId } from "./utils/createSignedEvent";

declare module "./eventBase" {
	interface Events {
		"m.room.power_levels": RoomPowerLevelsEvent;
	}
}

interface RoomPowerLevelsEvent extends EventBase {
	content: {
		users: {
			[key: string]: number;
		};
		users_default: number;
		events: {
			[key: string]: number;
		};
		events_default: number;
		state_default: number;
		ban: number;
		kick: number;
		redact: number;
		invite: number;
		historical: number;
	};
	unsigned?: {
		age_ts: number;
	};
}

export const roomPowerLevelsEvent = ({
	roomId,
	sender,
	member,
	auth_events,
	prev_events,
	depth,
	ts = Date.now(),
}: {
	roomId: string;
	sender: string;
	member: string;
	auth_events: string[];
	prev_events: string[];
	depth: number;
	ts?: number;
}) => {
	return createEventBase("m.room.power_levels", {
		roomId,
		sender,
		auth_events,
		prev_events,
		depth,
		ts,
		content: {
			users: { [sender]: 100, [member]: 100 },
			users_default: 0,
			events: {
				"m.room.name": 50,
				"m.room.power_levels": 100,
				"m.room.history_visibility": 100,
				"m.room.canonical_alias": 50,
				"m.room.avatar": 50,
				"m.room.tombstone": 100,
				"m.room.server_acl": 100,
				"m.room.encryption": 100,
			},
			events_default: 0,
			state_default: 50,
			ban: 50,
			kick: 50,
			redact: 50,
			invite: 0,
			historical: 100,
		},
		state_key: "",
		origin_server_ts: ts,
		unsigned: { age_ts: ts },
	});
};

export const createRoomPowerLevelsEvent =
	createEventWithId(roomPowerLevelsEvent);
