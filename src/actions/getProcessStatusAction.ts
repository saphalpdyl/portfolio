import { defineAction } from "astro:actions";
import OpenProcessesDataManagerSingleton from "../lib/OpenProcessesDataManager";

export default defineAction({
  handler: () => {
    const manager = OpenProcessesDataManagerSingleton.getInstance();

    return [manager.hasData(), manager.getDataAsHashMap(), manager.getPreviousTimestamp()];
  }
});