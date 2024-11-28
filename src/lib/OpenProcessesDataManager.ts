export default class OpenProcessesDataManagerSingleton {
  private processesStatus: ProcessData[] | null = null;
  private previousDataTimestamp: Date | null = null;

  static instance: OpenProcessesDataManagerSingleton;

  private constructor() {}
  
  static getInstance() {
    if ( !OpenProcessesDataManagerSingleton.instance ) {
      OpenProcessesDataManagerSingleton.instance = new OpenProcessesDataManagerSingleton();
    }
  
    return OpenProcessesDataManagerSingleton.instance;
  }

  hasData() {
    console.log("HAS DATA: ", this.processesStatus);
    return this.processesStatus !== null;
  }

  getData() {
    return this.processesStatus;
  }

  getDataAsHashMap() {
    if (!this.hasData()) return null;

    const hmap: {
      [_: string]: boolean,
    } = {};
    for ( const process of this.processesStatus! ) {
      hmap[process.appName] = process.isRunning;
    }

    return hmap;
  }

  getPreviousTimestamp() {
    return this.previousDataTimestamp;
  }
  
  setData(newStatus: ProcessData[]) {
    console.log("DATA CHANGE: ", newStatus);
    this.previousDataTimestamp = new Date();
    this.processesStatus = newStatus;
  }
}