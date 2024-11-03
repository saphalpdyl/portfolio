import { actions } from "astro:actions";
import { useEffect, useRef, useState } from "react";

const APP_TO_IMAGE_ICON_HASHMAP: {
  [_: string]: string,
} = {
  "Android Studio": "android-studio-icon.svg",
  "Visual Studio Code": "vscode.svg",
  "Postman": "postman.svg",
  "Visual Studio IDE": "visual_studio.svg",
  "Obsidian": "obsidian-icon.svg",
  "Chrome": "chrome.svg"
};

function CurrentlyRunningApplication() {
  const [processData, setProcessData] = useState<{
    [_: string]: boolean,
  } | null>(null);
  const serverHasDataRef = useRef(false);
  
  async function refreshProcessStatus() {
    // @ts-ignore
    const [hasData, data] = (await actions.getProcessStatus()).data;

    console.log("CLIENT [hasData, data]:", [hasData, data]);
    console.log("PREVIOUS ProcessDATA: ", processData);
    console.log("ServerHasRef: ", serverHasDataRef.current);
    
    if (!hasData) {
      serverHasDataRef.current = false;
      const fakeProcessData: {
        [_: string]: boolean,
      } = {};

      Object.keys(APP_TO_IMAGE_ICON_HASHMAP).forEach(processName => {
        fakeProcessData[processName] = false;
      });
      setProcessData(fakeProcessData);
      return;
    }

    serverHasDataRef.current = true;
    setProcessData(data);
  }
  
  useEffect(() => {
    refreshProcessStatus();
    const _interval = setInterval(refreshProcessStatus, 2000);
    
    return () => {
      clearInterval(_interval);
    }
  }, []);

  if (!processData) return <span className="text-xs font-serif">Connecting...</span>
  
  return <div className="flex flex-col items-center gap-1">
    <div className="flex gap-4 ">
      {
        Object.keys(APP_TO_IMAGE_ICON_HASHMAP).map(processName => {
          if (!(processName in processData )) return null;
          
          return <div 
            className={`
                h-8 w-8 
                ${processData[processName] ? "scale-110" : "scale-100"}
                transition-all 
              `}
            style={{
              filter: `grayscale(${processData[processName] == false ? "1.0": "0.0"})`
            }}
            >
            <img src={`/${APP_TO_IMAGE_ICON_HASHMAP[processName]}`} alt="Icon" />
          </div>
        })
      }
    </div>
    <span className="text-xs italic text-gray-600 font-serif">
      { 
        serverHasDataRef.current ? `I am ${Object.values(processData).filter(value => value === true).length > 0 ? "cooking" : "online"}.` : "I am AFK right now."
      }
    </span>
  </div>;
}

export default CurrentlyRunningApplication;