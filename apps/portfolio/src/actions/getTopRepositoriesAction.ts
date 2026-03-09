import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export default defineAction({
  input: z.object({
    top: z.number(),
  }),
  handler: async (input) => {
    const ignoreRepos = (import.meta.env.IGNORE_REPOSITORIES ?? "")
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

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
                  repositories(first: ${input.top + ignoreRepos.length}, orderBy: { field: PUSHED_AT, direction: DESC }, privacy: PUBLIC ) {
                      nodes {
                          name
                          nameWithOwner
                          description
                          url
                          masterReadme: object(expression: "master:README.md") {
                              ... on Blob {
                                text
                              }
                          }
                          mainReadme: object(expression: "main:README.md") {
                              ... on Blob {
                                text
                              }
                          }
                      }
                  }
              }
          }
        `
      })
    });

    const data = await rawResponse.json();
    const nodes = data.data.user.repositories.nodes;

    return ignoreRepos.length > 0
      ? nodes.filter((repo: { name: string }) => !ignoreRepos.includes(repo.name.toLowerCase()))
      : nodes;
  }
});