import getBusyStatusAction from "./getBusyStatusAction"
import getKaggleNotebooksMetadataAction from "./getKaggleNotebooksMetadataAction"
import getProcessStatusAction from "./getProcessStatusAction"
import getSpotifyCurrentlyPlayingAction from "./getSpotifyCurrentlyPlayingAction"
import getTopLanguagesAction from "./getTopLanguagesAction"
import getTopRepositoriesAction from "./getTopRepositoriesAction"
import getKaggleNotebooksHTMLDataAction from "./getKaggleNotebooksHTMLData"

export const server = {
  getTopLanguages: getTopLanguagesAction,
  getTopRepositories: getTopRepositoriesAction,
  getBusyStatus: getBusyStatusAction,
  getSpotifyCurrentlyPlaying: getSpotifyCurrentlyPlayingAction,
  getProcessStatus: getProcessStatusAction,
  getKaggleNotebooksMetadata: getKaggleNotebooksMetadataAction,
  getKaggleNotebooksHTMLData: getKaggleNotebooksHTMLDataAction,
}