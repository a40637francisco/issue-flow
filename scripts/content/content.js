const buildIssue = (i) => {
  const summary = i.querySelector('.ghx-summary').textContent
  const boardKey = i.querySelector('.ghx-issuekey-pkey').textContent
  const id = i.querySelector('.ghx-issuekey-number').textContent.replace('-', '')
  const type = i.querySelector('.ghx-field.ghx-field-icon').getAttribute('data-tooltip')
  return { id, boardKey, type, summary }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const action = request.action || null;

  const handlers = {
    GET_BOARD_TITLE: () => {
      const allText = document.querySelector('#breadcrumbs-container > div > div > div > a > span > span').textContent
      sendResponse({ title: allText.replace(' board', '') })
    },
    GET_BOARD_ISSUES: () => {
      const allIssues = Array.from(document.querySelectorAll('div[data-issue-id]')) // ver se o selector na nova board
      const issues = allIssues.map(i => {
        const issue = buildIssue(i)
        return { id: `${issue.id}`, type: issue.type, boardKey: issue.boardKey, summary: issue.summary }
      })
      sendResponse({ issues })
    },
    GET_SELECTED_ISSUE: () => {
      const issues = Array.from(document.querySelectorAll('.ghx-selected'))
      let selected = null
      if (issues.length === 1) {
        selected = buildIssue(issues[0])
      }
      sendResponse({ selected })
    },
  }

  if (action && handlers[action]) {
    handlers[action]()
  }

});
