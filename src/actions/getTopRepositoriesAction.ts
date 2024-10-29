import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export default defineAction({
  input: z.object({
    top: z.number(),
  }),
  handler: async (input) => {
    const rawResponse = await fetch(`https://api.github.com/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `bearer ${import.meta.env.GITHUB_API_KEY}`
      },
      body: JSON.stringify({
        query: `
          query {
              user(login: "saphalpdyl") {
                  repositories(first: ${input.top}, orderBy: { field: PUSHED_AT, direction: DESC }, privacy: PUBLIC ) {
                      nodes {
                          name
                          nameWithOwner
                          description
                          url
                      }
                  }
              }
          }
        `
      })
    });

    const data = await rawResponse.json();

    return data.data.user.repositories.nodes;
  }
});