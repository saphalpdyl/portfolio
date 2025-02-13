import { useEffect, useRef } from 'react';
import Skeleton from './common/Skeleton';

type Props = {
  htmlContent?: string;
  title: string;
}

export default function KaggleNotebookPreview({
  htmlContent,
  title
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeParent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc && iframeParent.current) {
        // Write the content to iframe
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);
  
  return (
    <div className={`
        transition-all 
        group-hover:opacity-100 opacity-0 
        left-20 bottom-10 group-hover:pointer-events-auto pointer-events-none 
        absolute z-[30] 
        xl:w-[40rem] lg:w-96 md:w-[40rem] hidden lg:block

        ${htmlContent ? "delay-0 group-hover:delay-1000" : "delay-200"}

        overflow-y-auto
        overflow-x-hidden
        ${htmlContent ? "h-96" : "h-24"} 
        p-4 rounded-xl bg-white/90
        border-2 shadow-md
    `}>
      {
        htmlContent && <div className='absolute w-full h-12 z-[40] bg-white/80 flex justify-center'>
          <span className='text-lg font-bold font-sans'>{ title }</span>
        </div>
      }
      {
        !htmlContent ? <Skeleton className='w-full h-full flex justify-center items-center font-mono' >Loading preview...</Skeleton> 
        : <div 
            className='h-full w-full'
            ref={iframeParent}
          >
            <iframe
              ref={iframeRef}
              className="w-full border-none h-full"
              title={title}
            />
        </div>
      }
    </div>
  )
}