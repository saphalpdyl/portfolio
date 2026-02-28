import { defineAction } from "astro:actions";

const IGNORE_REPOSITORIES = (import.meta.env.IGNORE_REPOSITORIES_IN_TOP_LANGUAGES || "").split(",")

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
        [prop: string]: {
          size: number,
          color: string
        }
      } = {};
  
      // Iterate through all repositories
      for (const repo of data.data.user.repositories.nodes) {
        if (IGNORE_REPOSITORIES.includes(repo.name)) continue;
        
        // Iterate through all languages in each repository
        for (const { size, node } of repo.languages.edges) {
          // Update the usage for each language
          if (languageUsage[node.name]) {
            languageUsage[node.name].size += size;
          } else {
            languageUsage[node.name] = {
              size,
              color: node.color
            };
          }
        }
      }
  
      // Calculate the total size across all languages
      const totalSize = Object.values(languageUsage).reduce((acc, lang) => acc + lang.size, 0);
  
      // Convert to a list of [language, percentage, color] tuples and sort by percentage in descending order
      return Object.entries(languageUsage)
        .map(([language, { size, color }]) => [
          language, 
          (size / totalSize * 100).toFixed(2),
          color
        ])
        .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
    } catch(e) {
      console.log("ERROR on getTopLanguagesServerAction: ", e);
    }
  }
});