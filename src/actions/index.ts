import getBusyStatusAction from "./getBusyStatusAction"
import getSpotifyCurrentlyPlayingAction from "./getSpotifyCurrentlyPlayingAction"
import getTopLanguagesAction from "./getTopLanguagesAction"
import getTopRepositoriesAction from "./getTopRepositoriesAction"

export const server = {
  getTopLanguages: getTopLanguagesAction,
  getTopRepositories: getTopRepositoriesAction,
  getBusyStatus: getBusyStatusAction,
  getSpotifyCurrentlyPlaying: getSpotifyCurrentlyPlayingAction,
}