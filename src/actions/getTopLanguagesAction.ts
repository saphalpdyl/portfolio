import { defineAction } from "astro:actions";

interface TopLanguagesResponse {
  data: {
    user: {
      repositories: {
        nodes: [{
          name: string,
          nameWithOwner: string,
          languages: {
            edges: [{
              size: number,
              node: {
                name: string,
                color: string,
              }
            }],
            totalSize: number,
          }
        }]
      }
    }
  }
}

export default defineAction({
  handler: async () => {
    try {

      const rawResponse = await fetch(`https://api.github.com/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `bearer ${import.meta.env.GITHUB_API_KEY}`,
        },
        body: JSON.stringify({
          query: `
            query {
              user(login: "saphalpdyl") {
                  repositories(first: 5, orderBy: {
                      field: PUSHED_AT,
                      direction: DESC,
                  }) {
                      nodes {
                          name
                          nameWithOwner
                          languages(first: 100) {
                              edges {
                                  size
                                  node {
                                      name
                                      color
                                  }
                              }
                              totalSize
                          }
                      }
                  }
              }
          }
          `
        })
      });
  
      const data: TopLanguagesResponse = await rawResponse.json();
  
      const languageUsage: {
        [prop: string]: number,
      } = {};
  
      // Iterate through all repositories
      for (const repo of data.data.user.repositories.nodes) {
        // Iterate through all languages in each repository
        for (const { size, node } of repo.languages.edges) {
          // Update the usage for each language
          if (languageUsage[node.name]) {
            languageUsage[node.name] += size;
          } else {
            languageUsage[node.name] = size;
          }
        }
      }
  
      // Calculate the total size across all languages
      const totalSize = Object.values(languageUsage).reduce((acc, size) => acc + size, 0);
  
      // Convert to a list of [language, percentage] tuples and sort by percentage in descending order
      return Object.entries(languageUsage)
        .map(([language, size]) => [language, (size / totalSize * 100).toFixed(2)])
        .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
    } catch(e) {
      console.log("ERROR on getTopLanguagesServerAction: ", e);
    }
  }
});