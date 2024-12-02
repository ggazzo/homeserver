import { expect, test } from "bun:test";

import { roomCreateEvent } from "./m.room.create";
import { generateKeyPairs } from "../keys";
import { generateId } from "../authentication";
import { signEvent } from "../signEvent";

const finalEventId = "$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4";
const finalEvent = {
	auth_events: [],
	prev_events: [],
	type: "m.room.create",
	room_id: "!uTqsSSWabZzthsSCNf:hs1",
	sender: "@admin:hs1",
	content: {
		room_version: "10",
		creator: "@admin:hs1",
	},
	depth: 1,
	state_key: "",
	origin: "hs1",
	origin_server_ts: 1733107418648,

	hashes: { sha256: "XFkxvgXOT9pGz5Hbdo7tLlVN2SmWhQ9ifgsbLio/FEo" },

	signatures: {
		hs1: {
			"ed25519:a_HDhg":
				"rmnvsWlTL+JP8Sk9767UR0svF4IrzC9zhUPbT+y4u31r/qtIaF9OtT1FP8tD/yFGD92qoTcRb4Oo8DRbLRXcAg",
		},
	},
	unsigned: { age_ts: 1733107418648 },
};

test("roomCreateEvent", async () => {
	const [signature] = await generateKeyPairs(
		Uint8Array.from(atob("WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw"), (c) =>
			c.charCodeAt(0),
		),
	);

	const event = roomCreateEvent({
		roomId: "!uTqsSSWabZzthsSCNf:hs1",
		sender: "@admin:hs1",
		ts: 1733107418648,
	});

	const signed = await signEvent(event, signature, "a_HDhg");

	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		"signatures.hs1.ed25519:a_HDhg",
		"rmnvsWlTL+JP8Sk9767UR0svF4IrzC9zhUPbT+y4u31r/qtIaF9OtT1FP8tD/yFGD92qoTcRb4Oo8DRbLRXcAg",
	);

	const eventId = generateId(signed);

	expect(eventId).toBe(finalEventId);
});
