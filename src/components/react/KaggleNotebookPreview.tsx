import React from 'react'
import Skeleton from './common/Skeleton';

type Props = {
  htmlContent?: string;
}

export default function KaggleNotebookPreview({
  htmlContent
}: Props) {
  return (
    <div className={`
        transition-all delay-200 group-hover:opacity-100 opacity-0 left-20 bottom-10 group-hover:pointer-events-auto pointer-events-none 
        absolute z-[30] 
        xl:w-[40rem] lg:w-96 md:w-[40rem] hidden md:block
        
        overflow-auto
        ${htmlContent ? "h-96" : "h-24"} 
        p-4 rounded-xl bg-white/90
        `}>
      {
        !htmlContent ? <Skeleton className='w-full h-full flex justify-center items-center font-mono' >Loading preview...</Skeleton> 
        : <div 
            className='scale-75'
          >
            <div 
            className='absolute'
              dangerouslySetInnerHTML={{
                __html: htmlContent,
              }}
            >

            </div>
        </div>
      }
    </div>
  )
}