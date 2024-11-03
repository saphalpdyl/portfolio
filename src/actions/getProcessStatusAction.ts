import { defineAction } from "astro:actions";
import OpenProcessesDataManagerSingleton from "../lib/OpenProcessesDataManager";

export default defineAction({
  handler: () => {
    const manager = new OpenProcessesDataManagerSingleton();

    return [manager.hasData(), manager.getDataAsHashMap()];
  }
});