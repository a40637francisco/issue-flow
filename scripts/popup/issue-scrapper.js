const boardTitleElem = document.getElementById('board-title')

const issueListElem = document.getElementById('issues-list')
const issuesFilters = document.getElementById('issues-filters')

const selectedIssueText = document.getElementById('selected-issue__text')
const selectedIssueTime = document.getElementById('selected-issue__time')
const selectedIssueTimeIcon = document.getElementById('selected-issue__time-icon')
const port = chrome.runtime.connect({ name: "knockknock" });

let selectedFilter = null

let issues = []

port.onMessage.addListener(function (msg) {
  const action = msg.action
  backgroundHandler[action](msg)
})

// --- BACKGROUND ACTIONS HANDLER ---
const backgroundHandler = ({
  ['ON-SELECT-ISSUE']: (msg) => {
    const time = formatMillisToFullTime(msg.time)
    if (msg.issueSelected) {
      selectedIssueText.innerHTML = `${msg.issueSelected.boardKey}-${msg.issueSelected.id} ${msg.issueSelected.summary}`
    }
    if (time) {
      selectedIssueTimeIcon.classList.remove('display-none')
    } else {
      selectedIssueTimeIcon.classList.add('display-none')
    }
    selectedIssueTime.innerHTML = time
  },
})

// --- CHROME ACTIONS HANDLER ---
const chromeTabsHandler = {
  GET_BOARD_ISSUES: (response) => {
    if (response && response.issues) {
      issues = response.issues
      setIssuesInDropdown(response.issues)
    }
  },
  GET_SELECTED_ISSUE: (response) => {
    if (response && response.selected) {
      port.postMessage({ action: "SELECT-ISSUE", body: response.selected });
      selectedIssueText.innerHTML = `${response.selected.boardKey}-${response.selected.id} ${response.selected.summary}`
    }
  },
  GET_BOARD_COLUMNS: (response) => {
    while (issuesFilters.childNodes.length > 0) {
      issuesFilters.removeChild(issuesFilters.lastChild);
    }
    if (response && response.columns)
      response.columns.map(f => buildFilterOption(f)).forEach(elem => issuesFilters.appendChild(elem))
  }
}

const callChromeTabsAction = (tabs, action, responseAction) => {
  chrome.tabs.sendMessage(tabs[0].id, { action }, function (response) {
    if (chrome.runtime.lastError)
      console.log(chrome.runtime.lastError)
    chromeTabsHandler[responseAction || action](response)
  })
}

const setIssuesInDropdown = (issues) => {
  while (issueListElem.childNodes.length > 1) {
    issueListElem.removeChild(issueListElem.lastChild);
  }
  issueListElem.appendChild(emptyOption())
  if (issues) {
    if (issues.length === 0) { return buildIssueOption(issueListElem, { boardKey: null, id: null, summary: 'Sem resultados...' }) }
    issues.forEach(i => {
      buildIssueOption(issueListElem, i)
    })
  }
}

const getIssuesFromBoard = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    callChromeTabsAction(tabs, 'GET_BOARD_ISSUES')
  })
}

const getSetSelectedIssue = () => {
  port.postMessage({ action: "GET-SELECTED-ISSUE" });
}

const buildIssueOption = (selectElem, issue) => {
  const option = document.createElement('option')
  option.value = JSON.stringify(issue)
  option.innerHTML = issue.id ? `${issue.boardKey}-${issue.id} ${issue.summary}` : issue.summary
  option.title = issue.id ? `${issue.boardKey}-${issue.id} ${issue.summary}` : issue.summary
  selectElem.appendChild(option)
}

function formatMillisToFullTime(millisec) {
  if (!millisec) return ''
  let seconds = (millisec / 1000).toFixed(0);
  let minutes = Math.floor(seconds / 60);
  let hours = "";
  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    hours = (hours >= 10) ? hours : "0" + hours;
    minutes = minutes - (hours * 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
  }

  seconds = Math.floor(seconds % 60);
  seconds = (seconds >= 10) ? seconds : seconds;
  if (minutes <= 0) {
    return `${seconds}s`
  }
  if (hours != "") {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`;
}

const emptyOption = () => {
  const option = document.createElement('option')
  option.value = ''
  option.innerHTML = `Select issue`
  option.selected = true
  option.disabled = true
  option.hidden = true
  return option
}

const getBoardColumns = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    callChromeTabsAction(tabs, 'GET_BOARD_COLUMNS')
  })
}

const buildFilterOption = filter => {
  const span = document.createElement('span')
  span.innerHTML = filter.text
  span.value = filter.columnId
  span.addEventListener('click', (e) => {
    if (selectedFilter)
      selectedFilter.classList.remove('issues-filters__filter-selected')

    selectedFilter = e.target
    e.target.classList.add('issues-filters__filter-selected')

    const filteredIssues = issues.filter(i => i.columnId === e.target.value)
    setIssuesInDropdown(filteredIssues)
  })
  return span
}