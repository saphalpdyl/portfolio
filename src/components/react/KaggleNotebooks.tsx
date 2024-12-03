import { actions } from "astro:actions"
import { useEffect, useState } from "react";
import Skeleton from "./common/Skeleton";

type Props = {}

type Notebook = {
  title: string,
  filepath: string,
}

// Get the metadata.json first
// DISPLAY only the title and then prefetch on hover only for performance
export default function KaggleNotebooks({}: Props) {
  const [notebooks, setNotebooks] = useState<Notebook[] | null>(null);
  const [loading, setLoading] = useState(true);

  const _fetchNotebooksMetadata = async () => {
    const response = await actions.getKaggleNotebooksMetadata({
      repository: import.meta.env.PUBLIC_NOTEBOOK_REPOSITORY,
    });

    const {
      data,
      error
    } = response;

    if (error) {
      console.error("ERROR: Failed to load metadata.json from remote")
    }

    const metadata = data as NotebookMetadata

    const notebookGroup = metadata.data.find(group => group.group == "kaggle");
  
    setNotebooks(
      notebookGroup!.files.map(notebook => ({
        title: notebook.metadata["title"],
        filepath: notebook.filepath,
      } as Notebook))
    )
    setLoading(false);
  }

  useEffect(() => {
    _fetchNotebooksMetadata();
  }, [])

  if (loading) {
    return <div className="w-full py-2 space-y-3">
      <Skeleton className="w-full h-12"/>
      <Skeleton className="w-full h-12"/>
      <Skeleton className="w-full h-12"/>
      <Skeleton className="w-full h-12"/>
    </div>
  }

  return <div className={`
      flex flex-col gap-2 my-2
      ${notebooks!.length > 4 ? "overflow-y-scroll h-60" : ""}
    `}>
    {
      notebooks!.map(notebook => (
        <div className="px-4 py-2 text-xs font-serif border-[1px] border-gray-400 rounded-lg flex flex-col gap-1">
          <a 
            href={`/notebooks/${notebook.filepath}`}
            aria-label={notebook.title} 
            className="text-blue-500 underline cursor-pointer"
            >
            { notebook.title }
          </a>  
          <span className="text-gray-500 text-[11px] font-mono">Group: Kaggle Notebooks</span>
        </div>
      ))
    }
  </div>
}