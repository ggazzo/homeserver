import { Elysia } from "elysia";

import "@hs/endpoints/src/query";
import "@hs/endpoints/src/server";
import { config } from "../../../config";
import { signJson } from "../../../signJson";
import { authorizationHeaders } from "../../../authentication";

const makeRequest = async ({ method, domain, uri, options = {} }: { method: string; domain: string; uri: string; options?: Record<string, any>; }) => {
  const signingKey = config.signingKey[0];

  const auth = await authorizationHeaders(
    config.name,
    signingKey,
    domain,
    method,
    uri,
    options.body,
  );

  console.log('auth ->', auth);

  const body = (options.body && {
    body: JSON.stringify(await signJson({ ...options.body, signatures: {} }, config.signingKey[0], config.name)),
  });

  console.log('body ->', body);

  return fetch(`https://${domain}${uri}`, {
    ...options,
    ...body,
    method,
    headers: {
      Authorization: auth,
    },
  });
}

export const inviteEndpoint = new Elysia().put(
  "/invite/:roomId/:eventId",
  ({ params, body }) => {
    setTimeout(async () => {
      const { event } = body as any;

      const response = await makeRequest({
        method: 'GET',
        domain: event.origin,
        uri: `/_matrix/federation/v1/make_join/${params.roomId}/${event.state_key}?ver=10`
      });

      const responseMake = await response.json();
      console.log("make_join ->", responseMake);

      const joinBody = responseMake.event;

      joinBody.origin = config.name;
      joinBody.origin_server_ts = Date.now();

      console.log("joinBody ->", joinBody);

      const responseSend = await makeRequest({
          method: 'PUT',
          domain: event.origin,
          uri: `/_matrix/federation/v1/send_join/${params.roomId}/${event.state_key}?omit_members=true`,
          options: {
            body: joinBody,
          }
        });

      const responseBody = await responseSend.json();

      console.log("send_join ->", responseBody);
    }, 1000);

    return config.signingKey.reduce(
      (json: any, signingKey) => signJson(json, signingKey, config.name),
      body
    );
  }
);
