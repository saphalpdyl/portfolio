import { useEffect, useState } from "react";
import { actions } from "astro:actions";

import Spinner from "./Spinner";

const PROGRESS_BAR_TOTAL_LENGTH = 10;
const TOP_LANGUAGES = 6;

function ProgressBar({ percentage } : {
  percentage: number,
}) {
  const filledBlocks = Math.round((percentage / 100) * PROGRESS_BAR_TOTAL_LENGTH);
  const emptyBlocks = PROGRESS_BAR_TOTAL_LENGTH - filledBlocks;
  
  return (
    <div className="font-mono text-zinc-500">
      [{'█'.repeat(filledBlocks)}
      {'░'.repeat(emptyBlocks)}]
      <span className="font-serif italic">{percentage.toFixed(2)}%</span>
    </div>
  );
}

function TopLanguages({ githubLogo }: {
  githubLogo?: React.ReactNode,
}) {
  const [languages, setLanguages] = useState<null | string[][]>(null);

  async function _refreshLanguages() {
    const data = await actions.getTopLanguages({
      top: 10,
    });
    if (data == undefined)
      throw new Error("Data is undefined");
    
    setLanguages(data.data!);
  }
  
  useEffect(() => {
    _refreshLanguages();
  }, []);

  if (!languages) return <Spinner />

  return (
    <div className="flex flex-col font-serif">
      <div className="flex gap-2 justify-center items-center font-semibold">
        Most Used Languages on GitHub 
        <div className="w-6 h-6">
          { githubLogo }
        </div>
      </div>
      <div className="grid grid-cols-2 font-serif">
        {
          languages && languages.slice(0,TOP_LANGUAGES).map(([language, percentage]) => {
            return <>
              {`${language.padEnd(30)}: `}
              <ProgressBar percentage={parseFloat(percentage)} />
            </>
          })
        }
      </div>
    </div>
  ) 
}

export default TopLanguages;