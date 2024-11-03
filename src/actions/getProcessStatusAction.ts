import { defineAction } from "astro:actions";
import OpenProcessesDataManagerSingleton from "../lib/OpenProcessesDataManager";

export default defineAction({
  handler: () => {
    const manager = new OpenProcessesDataManagerSingleton();

    console.log("ACTION: ", [manager.hasData(), manager.getDataAsHashMap()])

    return [manager.hasData(), manager.getDataAsHashMap(), manager.getPreviousTimestamp()];
  }
});