
let interval;
let timerInterval;
let saveInterval;

const TIMER_STOPPED = 'STOPPED'
const TIMER_RUNNING = 'RUNNING'
const TIMER_PAUSED = 'PAUSED'

let timerState = TIMER_STOPPED
let issueSelected = null

const selectIssue = (issue) => {
  if (issueSelected && (issue.boardKey !== issueSelected.boardKey || issue.id === issueSelected.id)) {
    stopTimer()
  }
  issueSelected = issue
  storageSetSelectedIssue(issueSelected)
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    if (msg.action === 'SELECT-ISSUE') {
      const issue = msg.issue
      selectIssue(issue)
      getIssueTime(issue, function (time) {
        port.postMessage({ action: 'ON-SELECT-ISSUE', time, issueSelected: issue })
      })
    } else if (msg.action === 'TIMER-START') {
      startTimer()
    } else if (msg.action === 'TIMER-STOP') {
      stopTimer()
    } else if (msg.action === 'TIMER-PAUSE') {
      pauseTimer()
    } else if (msg.action === 'TIMER-RESUME') {
      resumeTimer()
    } else if (msg.action === 'GET-SELECTED-ISSUE') {
      getSelectedIssue(port, (issue) => {
        if (issue)
          getIssueTime(issue, function (time) {
            port.postMessage({ action: 'ON-SELECT-ISSUE', time, issueSelected: issue })
          })
      })
    }
  })
})

const getSelectedIssue = (port, cb) => {
  if (issueSelected !== null) {
    cb(issueSelected)
  } else {
    storageGetSelectedIssue((issue => {
      if (issue !== null) {
        issueSelected = issue
        cb(issueSelected)
      } else {
        cb(null)
      }
    }))
  }
}

const fillLeftZero = (number) => {
  return number < 10 ? '0' + number : number
}

// TIMER 
const startTimer = () => {
  timerState = TIMER_RUNNING
  chrome.browserAction.setBadgeText({ text: '' });
  chrome.storage.sync.set({ timerState });

  let hours = 0
  let minutes = 0
  let seconds = 0

  timerInterval = setInterval(() => {
    if (timerState !== TIMER_RUNNING) return
    if (seconds === 60) {
      minutes += 1
      seconds = 0
    }
    if (minutes === 60) {
      hours += 1
      minutes = 0
    }
    seconds += 1
    chrome.browserAction.setBadgeText({
      text: hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : `${fillLeftZero(seconds)}s`
    });
  }, 1000)

  saveInterval = setInterval(() => {
    if (timerState !== TIMER_RUNNING) return
    addSecondsToIssue()
  }, 30000);
}

const stopTimer = () => {
  timerState = TIMER_STOPPED
  chrome.storage.sync.set({ timerState });
  chrome.browserAction.setBadgeText({
    text: ''
  });
  clearInterval(saveInterval)
  clearInterval(timerInterval)
}

const pauseTimer = () => {
  timerState = TIMER_PAUSED
  chrome.storage.sync.set({ timerState });
}

const resumeTimer = () => {
  timerState = TIMER_RUNNING
  chrome.storage.sync.set({ timerState });
}



// POMODORO
const startPomodoro = () => {
  chrome.browserAction.setBadgeText({ text: '2:00' });
  chrome.alarms.create({ delayInMinutes: 2 });
  chrome.storage.sync.set({ running: true });

  let minutes = 1
  let seconds = 59
  interval = setInterval(() => {
    if (seconds === 0) {
      if (minutes === 0) {
        chrome.browserAction.setBadgeText({
          text: `off`
        });
        stopTimer()
      } else {
        minutes -= 1
        seconds = 59
      }
    } else {
      seconds -= 1
    }
    chrome.browserAction.setBadgeText({
      text: `${minutes}:${seconds}`
    });
  }, 1000)
}

const stopPomodoro = () => {
  timerState = false
  chrome.storage.sync.set({ running });
  chrome.alarms.clearAll();
  chrome.browserAction.setBadgeText({
    text: ''
  });
  clearInterval(interval)
}


// ALARM
chrome.alarms.onAlarm.addListener(function () {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/stay_hydrated.png',
    title: 'Pomodoro Timer',
    message: 'Everyday I\'m Guzzlin\'!',
    buttons: [{
      title: 'STOP'
    }],
    priority: 0
  });
});

chrome.notifications.onButtonClicked.addListener(function () {

});
