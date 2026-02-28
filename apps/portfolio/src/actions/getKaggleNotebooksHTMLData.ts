import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export default defineAction({
  input: z.object({
    filepath: z.string(),
  }),
  handler: async (input) => {
    const notebookResponse = await fetch(`https://api.github.com/repos/saphalpdyl/kaggle_notebooks/contents/${input.filepath}`, {
      headers: {
        "Accept": "application/vnd.github.v3.raw",
        "Authorization": `Bearer ${import.meta.env.GITHUB_API_KEY}`,
      }
    });
    
    return await notebookResponse.text()
  }
})