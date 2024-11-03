export default class OpenProcessesDataManagerSingleton {
  private processesStatus: ProcessData[] | null;

  
  static instance: OpenProcessesDataManagerSingleton;

  constructor() {
    this.processesStatus = null;
    
    if ( !OpenProcessesDataManagerSingleton.instance ) {
      OpenProcessesDataManagerSingleton.instance = this;
    }

    return OpenProcessesDataManagerSingleton.instance;
  }

  hasData() {
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

  setData(newStatus: ProcessData[]) {
    this.processesStatus = newStatus;
  }
}