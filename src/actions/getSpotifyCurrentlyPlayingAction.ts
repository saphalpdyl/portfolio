import { defineAction } from "astro:actions";

import SpotifyCredentialsManagerSingleton from "../lib/SpotifyCredentialsManager";

async function sendNetworkRequest(
  accessToken: string,
) {
  return await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
}

export default defineAction({
  handler: async () : Promise<SpotifyCurrentlyPlaying> => {
    const manager = new SpotifyCredentialsManagerSingleton();

    let response = await sendNetworkRequest(await manager.getAccessToken());
    if ( response.status === 401 ) {
      response = await sendNetworkRequest(await manager.generateAccessToken());
    }

    if ( response.status === 429 ) return {
      status: "rate_limited"
    };

    if ( response.status === 204 ) return {
      status: "offline"
    };

    const data = await response.json();

    return {
      status: "playing",
      data,
    };
  }
});