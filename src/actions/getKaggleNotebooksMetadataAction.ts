import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export default defineAction({
  input: z.object({
    repository: z.string(),
  }),
  handler: async (input) => {
    // Get the metadata.json of the repository
    const response = await fetch(`https://api.github.com/repos/saphalpdyl/${input.repository}/contents/metadata.json`, {
      headers: {
        "Accept": "application/vnd.github.v3.raw", // To get raw data instead of base64 encoded data
        "Authorization": `Bearer ${import.meta.env.GITHUB_API_KEY}`,
      },
    });

    if (response.status >= 300) {
      console.error("ERROR: Couldn't fetch from repository for metadata information")
      return 
    }

    const metadata = await response.json()

    return metadata
  }
})