// import crypto from "node:crypto";

// import type { APIRoute } from "astro";
// import OpenProcessesDataManagerSingleton from "../../lib/OpenProcessesDataManager";

// export const POST: APIRoute = async ({ request }) => {
//   const dataManager = OpenProcessesDataManagerSingleton.getInstance();
  
//   const body = await request.json();

//   // Verifying hash
//   const vertificationHmac = crypto.createHmac("sha256", import.meta.env.PROCESS_API_SECRET);
//   vertificationHmac.write(JSON.stringify(body.payload));
//   vertificationHmac.end();
//   const calculatedHash = vertificationHmac.read().toString("hex");

//   if ( calculatedHash !== body.hash ) {
//     console.error("ERROR: Couldn't verify hash. The data might have been tampered with.");
//     return new Response(JSON.stringify({
//       status: 400,
//       message: "Invalid hash signature"
//     }))
//   }

//   dataManager.setData(body.payload);
  
//   return new Response(null, {
//     status: 204,
//   });
// }