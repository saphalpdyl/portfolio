const DATA_EXPIRE_MILLIS = 10000;

export default class OpenProcessesDataManagerSingleton {
  private processesStatus: ProcessData[] | null;
  private previousDataTimestamp: Date | null;

  static instance: OpenProcessesDataManagerSingleton;

  constructor() {
    this.processesStatus = null;
    this.previousDataTimestamp = null;
    
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

  #clearData() {
    this.processesStatus = null;
  }

  getPreviousTimestamp() {
    return this.previousDataTimestamp;
  }
  
  setData(newStatus: ProcessData[]) {
    this.previousDataTimestamp = new Date();
    this.processesStatus = newStatus;
  }
}