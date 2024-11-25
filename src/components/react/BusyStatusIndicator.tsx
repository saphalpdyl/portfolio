import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { isDateToday } from "../../lib/utils";

const DATE_FORMAT_OPTIONS = { hour: '2-digit', minute: '2-digit' } satisfies Intl.DateTimeFormatOptions;

interface ChipProps {
  type: "loading" | "free" | "busy";
  text: string;
  note?: string;
}

function Chip({
  type,
  text,
  note
}: ChipProps) {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex gap-2 justify-center items-center rounded-full bg-gray-100 px-2 py-1 ">
        <div className={`
          w-2 h-2 
          rounded-full
          ${type == "loading" ? "bg-yellow-500" : type == "busy" ? "bg-red-500" : "bg-green-500"}
          ring-2 ring-offset-1
          ${type == "loading" ? "ring-yellow-600" : type == "busy" ? "ring-red-600" : "ring-green-600"}
          animate-pulse
        `}></div>
        <span className={`
          text-xs font-serif
          ${type == "loading" ? "" : type == "busy" ? "text-red-700" : "text-green-700"}
        `}>{ text }</span>
      </div>
      <span className="text-[10px] text-gray-600">{ note }</span>
    </div>
  )
}

function BusyStatusIndicator() {
  const [ error, setError ] = useState<null | string>(null);
  const [ loading, setLoading ] = useState(true);
  const [ status, setStatus ] = useState<null | FreeBusyStatus>(null);
  
  async function _refreshStatus() {
    const data = await actions.getBusyStatus({});
    if ( data.error ) {
      setError("Some error has occurred.")
      setLoading(false);
      setStatus(null);
      return;
    }
      
    setError(null);
    setLoading(false);
    setStatus(data.data);
  }
  
  useEffect(() => {
    _refreshStatus();
    const _interval = setInterval(_refreshStatus, 5000);

    return () => {
      clearTimeout(_interval);
    }
  }, []);
  
  if ( error ) return <span className="text-red-500 text-xs"> Widget error: { error }</span>
  
  if ( loading ) {
    return <Chip type="loading" text="Searching calendar for events" />
  }
  
  
  if ( status && status.status == "busy" ) {
    let freeText = "Will be free in the future"

    if ( status.freeAt ) {
      if ( !isDateToday(status.freeAt) ) {
        // Won't be free for today
        freeText = "Saphal is really busy today"
      } else {
        freeText = `Will be free on ${status.freeAt?.toLocaleTimeString('en-US', DATE_FORMAT_OPTIONS)}`
      }
    }
    
    
    return <Chip 
      type="busy" 
      text="Saphal is currently busy" 
      note={freeText}
    />
  }
    
  let busyText = "Will be busy in the future"
  if ( status?.busyAt ) {
    if ( !isDateToday(status.busyAt) ) {
      busyText = "Saphal is free for today"
    } else {
      busyText = `Will be busy on ${status?.busyAt?.toLocaleTimeString('en-US', DATE_FORMAT_OPTIONS)}`;
    }
  } 
    
  return <Chip 
    type="free" 
    text="Saphal is currently free" 

    // If I will be busy tommorow mention it 
    // No need to mention for free ( doesn't make sense )
    note={busyText}
  />
}

export default BusyStatusIndicator;