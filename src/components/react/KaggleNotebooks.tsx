import { actions } from "astro:actions"
import { useEffect, useState } from "react";
import Skeleton from "./common/Skeleton";
import KaggleNotebookPreview from "./KaggleNotebookPreview";

type Props = {}

type Notebook = {
  title: string,
  filepath: string,
  htmlContent?: string,
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

    const notebookGroup = metadata.data.find(group => group.group == import.meta.env.PUBLIC_NOTEBOOK_GCMS_GROUP);
  
    setNotebooks(
      notebookGroup!.files.map(notebook => ({
        title: notebook.metadata["title"],
        filepath: notebook.filepath,
      } as Notebook))
    )
    setLoading(false);
  }
  
  const fetchNotebookHTMLData = async (notebookFilePath: string) => {
    const thisNotebook = notebooks?.find(nb => nb.filepath === notebookFilePath);

    if (thisNotebook?.htmlContent) return;

    const { data } = await actions.getKaggleNotebooksHTMLData({
      filepath: notebookFilePath,
    });

    setNotebooks(notebooks!.map(nb => 
      nb.filepath === notebookFilePath 
        ? { ...nb, htmlContent: data }
        : nb
    ));
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

  return <div 
    className={`
      flex flex-col gap-2 my-2 overflow-x-hidden overflow-y-auto
      ${
        // TODO: Implement pagination
        notebooks!.length > 4 ? 
          "h-60 md:grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" 
          : ""
      }
    `}>
    {
      notebooks!.map((notebook, index) => (
        <div 
          onMouseEnter={() => fetchNotebookHTMLData(notebook.filepath)}
          className="static group px-4 py-2 text-xs font-serif border-[1px] border-gray-400 rounded-lg flex flex-col gap-1"
        >
          <KaggleNotebookPreview htmlContent={notebook.htmlContent} title={notebook.title}/>
          <a 
            href={`/notebooks/${notebook.filepath}`}
            aria-label={notebook.title} 
            className="text-blue-500 underline cursor-pointer"
            >
            { notebook.title }
          </a>  
          <span className="text-gray-500 text-[11px] font-mono">Group: Kaggle Notebooks</span>

          {
            index == 1 && <p className="absolute bottom-0 right-0 text-xs font-serif lg:block hidden text-gray-400 font-light p-1">Hover to show preview</p>
          }
        </div>
      ))
    }
  </div>
}