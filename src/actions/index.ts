import getBusyStatusAction from "./getBusyStatusAction"
import getTopLanguagesAction from "./getTopLanguagesAction"
import getTopRepositoriesAction from "./getTopRepositoriesAction"

export const server = {
  getTopLanguages: getTopLanguagesAction,
  getTopRepositories: getTopRepositoriesAction,
  getBusyStatus: getBusyStatusAction,
}