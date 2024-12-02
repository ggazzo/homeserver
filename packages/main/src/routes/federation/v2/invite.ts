import { Elysia, t } from "elysia";

import "@hs/endpoints/src/query";
import "@hs/endpoints/src/server";
import { makeRequest } from "../../../makeRequest";
import { config } from "../../../config";
import { signJson } from "../../../signJson";
import { InviteEventDTO } from "../../../dto";
import { StrippedStateDTO } from "../../../dto";
import { ErrorDTO } from "../../../dto";
// import { events } from "../../../mongodb";

export const inviteEndpoint = new Elysia().put(
	"/invite/:roomId/:eventId",
	async ({ params, body }) => {
		await events.insertOne(body.event);

		setTimeout(async () => {
			const { event } = body;

			const response = await makeRequest({
				method: "GET",
				domain: event.origin,
				uri: `/_matrix/federation/v1/make_join/${params.roomId}/${event.state_key}?ver=10`,
			});

			const responseMake = await response.json();
			console.log("make_join ->", responseMake);

			if (responseMake.errcode) {
				return;
			}

			// const joinBody = {
			//   type: 'm.room.member',
			//   origin: config.name,
			//   origin_server_ts: Date.now(),
			//   room_id: responseMake.event.room_id,
			//   state_key: responseMake.event.state_key,
			//   sender: responseMake.event.sender,
			//   depth: responseMake.event.depth + 1,
			//   content: {
			//     membership: 'join'
			//   }
			// };

			const joinBody = {
				...responseMake.event,
				origin: config.name,
				origin_server_ts: Date.now(),
				depth: responseMake.event.depth + 1,
			};

			console.log("joinBody ->", joinBody);

			const responseSend = await makeRequest({
				method: "PUT",
				domain: event.origin,
				uri: `/_matrix/federation/v1/send_join/${params.roomId}/${event.state_key}?omit_members=true`,
				options: {
					body: joinBody,
				},
			});

			const responseBody = await responseSend.json();

			console.log("send_join ->", responseBody);
		}, 1000);

		return { event: body.event };
	},
	{
		params: t.Object(
			{
				roomId: t.String({
					description: "The room ID that the user is being invited to.",
				}),
				eventId: t.String({
					description:
						"The event ID for the invite event, generated by the inviting server.",
				}),
			},
			{
				examples: [
					{
						roomId: "!abc123:matrix.org",
						eventId: "$abc123:example.org",
					},
				],
			},
		),
		// body: t.Object(
		// 	{
		// 		room_version: t.String({
		// 			description:
		// 				"The version of the room where the user is being invited to.",
		// 		}),
		// 		event: InviteEventDTO,
		// 		invite_room_state: t.Optional(
		// 			t.Array(StrippedStateDTO, {
		// 				description:
		// 					"An optional list of [stripped state events](https://spec.matrix.org/latest/client-server-api/#stripped-state)\nto help the receiver of the invite identify the room.",
		// 			}),
		// 		),
		// 	},
		// 	{
		// 		examples: [
		// 			{
		// 				room_version: "2",
		// 				event: {
		// 					room_id: "!somewhere:example.org",
		// 					type: "m.room.member",
		// 					state_key: "@joe:elsewhere.com",
		// 					origin: "example.org",
		// 					origin_server_ts: 1549041175876,
		// 					sender: "@someone:example.org",
		// 					content: {
		// 						membership: "invite",
		// 					},
		// 					signatures: {
		// 						"example.com": {
		// 							"ed25519:key_version": "SomeSignatureHere",
		// 						},
		// 					},
		// 				},
		// 			},
		// 		],
		// 	},
		// ),
		// response: {
		// 	200: t.Object(
		// 		{
		// 			event: InviteEventDTO,
		// 		},
		// 		{
		// 			description:
		// 				'**Note:**\nThis API is nearly identical to the v1 API with the exception of the request\nbody being different, and the response format fixed.\n\nInvites a remote user to a room. Once the event has been  signed by both the inviting\nhomeserver and the invited homeserver, it can be sent to all of the servers in the\nroom by the inviting homeserver.\n\nThis endpoint is preferred over the v1 API as it is more useful for servers. Senders\nwhich receive a 400 or 404 response to this endpoint should retry using the v1\nAPI as the server may be older, if the room version is "1" or "2".\n\nNote that events have a different format depending on the room version - check the\n[room version specification](https://spec.matrix.org/latest/rooms) for precise event formats. **The request and response\nbodies here describe the common event fields in more detail and may be missing other\nrequired fields for a PDU.**',
		// 			examples: [
		// 				{
		// 					event: {
		// 						room_id: "!somewhere:example.org",
		// 						type: "m.room.member",
		// 						state_key: "@someone:example.org",
		// 						origin: "example.org",
		// 						origin_server_ts: 1549041175876,
		// 						sender: "@someone:example.org",
		// 						unsigned: {
		// 							invite_room_state: [
		// 								{
		// 									type: "m.room.name",
		// 									sender: "@bob:example.org",
		// 									state_key: "",
		// 									content: {
		// 										name: "Example Room",
		// 									},
		// 								},
		// 								{
		// 									type: "m.room.join_rules",
		// 									sender: "@bob:example.org",
		// 									state_key: "",
		// 									content: {
		// 										join_rule: "invite",
		// 									},
		// 								},
		// 							],
		// 						},
		// 						content: {
		// 							membership: "invite",
		// 						},
		// 						signatures: {
		// 							"example.com": {
		// 								"ed25519:key_version": "SomeSignatureHere",
		// 							},
		// 							"elsewhere.com": {
		// 								"ed25519:k3y_versi0n": "SomeOtherSignatureHere",
		// 							},
		// 						},
		// 					},
		// 				},
		// 			],
		// 		},
		// 	),
		// 	400: t.Composite(
		// 		[
		// 			ErrorDTO,
		// 			t.Object({
		// 				room_version: t.Optional(
		// 					t.String({
		// 						description:
		// 							"The version of the room. Required if the `errcode`\nis `M_INCOMPATIBLE_ROOM_VERSION`.",
		// 					}),
		// 				),
		// 			}),
		// 		],
		// 		{
		// 			description:
		// 				"The request is invalid or the room the server is attempting\nto join has a version that is not listed in the `ver`\nparameters.\n\nThe error should be passed through to clients so that they\nmay give better feedback to users.",
		// 			examples: [
		// 				{
		// 					errcode: "M_INCOMPATIBLE_ROOM_VERSION",
		// 					error:
		// 						"Your homeserver does not support the features required to join this room",
		// 					room_version: "3",
		// 				},
		// 			],
		// 		},
		// 	),
		// 	403: t.Composite([ErrorDTO], {
		// 		description:
		// 			"The invite is not allowed. This could be for a number of reasons, including:\n\n* The sender is not allowed to send invites to the target user/homeserver.\n* The homeserver does not permit anyone to invite its users.\n* The homeserver refuses to participate in the room.",
		// 		examples: [
		// 			{
		// 				errcode: "M_FORBIDDEN",
		// 				error: "User cannot invite the target user.",
		// 			},
		// 		],
		// 	}),
		// },
		detail: {
			description:
				'**Note:**\nThis API is nearly identical to the v1 API with the exception of the request\nbody being different, and the response format fixed.\n\nInvites a remote user to a room. Once the event has been  signed by both the inviting\nhomeserver and the invited homeserver, it can be sent to all of the servers in the\nroom by the inviting homeserver.\n\nThis endpoint is preferred over the v1 API as it is more useful for servers. Senders\nwhich receive a 400 or 404 response to this endpoint should retry using the v1\nAPI as the server may be older, if the room version is "1" or "2".\n\nNote that events have a different format depending on the room version - check the\n[room version specification](/rooms) for precise event formats. **The request and response\nbodies here describe the common event fields in more detail and may be missing other\nrequired fields for a PDU.**',
			operationId: "sendInviteV2",
		},
	},
);
