
const setIssueHistoryStorage = (history) => {
  chrome.storage.sync.set({ history });
}

const getIssueTime = (issue, cb) => {
  if (!issue) return cb(null)

  chrome.storage.sync.get(['history'], function (result) {
    const history = result.history ? result.history : {}

    const issueFromStorage = history[issue.boardKey] ? history[issue.boardKey][issue.id] : null
    cb(issueFromStorage)
  })
}

const getIssuesTime = (cb) => {
  chrome.storage.sync.get(['history'], function (result) {
    const history = result.history ? result.history : null
    cb(history)
  })
}

const addSecondsToIssue = () => {
  const secondsToAdd = 30000
  getIssuesTime((issues) => {
    let history = issues
    if (!history || !history[issueSelected.boardKey]) {
      history = { [issueSelected.boardKey]: { [issueSelected.id]: 30000 } }
    } else {
      history[issueSelected.boardKey][issueSelected.id] = (history[issueSelected.boardKey][issueSelected.id] || 0) + secondsToAdd
    }
    setIssueHistoryStorage(history)
  })
}

const storageGetSelectedIssue = (cb) => {
  chrome.storage.sync.get(['issueSelected'], function (result) {
    cb(result.issueSelected)
  })
}

const storageSetSelectedIssue = (issueSelected) => {
  chrome.storage.sync.set({ issueSelected });
}
