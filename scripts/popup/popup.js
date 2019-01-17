const TIMER_MENU = 'TIMER'
const POMODORO_MENU = 'POMODORO'

const TIMER_STOPPED = 'STOPPED'
const TIMER_RUNNING = 'RUNNING'
const TIMER_PAUSED = 'PAUSED'

let timerState = TIMER_STOPPED
let menu = TIMER_MENU

const backendPort = chrome.runtime.connect({ name: "backend" });

// -------------- LAYOUT ----------------------
const setRunningTimerButtons = () => {
  const startTimerElem = document.getElementById('timer-start')
  const actionsWrapper = document.getElementById('timer-on__actions')
  startTimerElem.classList.add('display-none')
  actionsWrapper.classList.remove('display-none')

  const pauseTimerElem = document.getElementById('timer-pause')
  if (timerState === TIMER_RUNNING)
    pauseTimerElem.innerText = 'PAUSE'
  if (timerState === TIMER_PAUSED)
    pauseTimerElem.innerText = 'RESUME'
}

const clearRunningTimerButtons = () => {
  const startTimerElem = document.getElementById('timer-start')
  const actionsWrapper = document.getElementById('timer-on__actions')
  startTimerElem.classList.remove('display-none')
  actionsWrapper.classList.add('display-none')

}

const setTimerLayout = () => {
  const timerElem = document.getElementById('timer-controls')
  const pomodoroElem = document.getElementById('pomodoro-controls')
  timerElem.classList.remove('display-none')
  pomodoroElem.classList.add('display-none')
}

const setPomodoroLayout = () => {
  const timerElem = document.getElementById('timer-controls')
  const pomodoroElem = document.getElementById('pomodoro-controls')
  timerElem.classList.add('display-none')
  pomodoroElem.classList.remove('display-none')
}

const refreshTimerButtons = () => {
  if (timerState === TIMER_RUNNING || timerState === TIMER_PAUSED) {
    setRunningTimerButtons()
  } else if (timerState === TIMER_STOPPED) {
    clearRunningTimerButtons()
  }
}

const refreshMenuButtons = () => {
  const pomodoroElem = document.getElementById('pomodoro-btn')
  const timerElem = document.getElementById('timer-btn')
  if (menu === POMODORO_MENU) {
    pomodoroElem.classList.add('menu-selected')
    timerElem.classList.remove('menu-selected')
  } else if (menu === TIMER_MENU) {
    pomodoroElem.classList.remove('menu-selected')
    timerElem.classList.add('menu-selected')
  }
}

const refreshLayout = () => {
  if (menu === TIMER_MENU) {
    setTimerLayout()
  }
  if (menu === POMODORO_MENU) {
    setPomodoroLayout()
  }
  refreshMenuButtons()
  refreshTimerButtons()
}

// ---------------- TIMER ---------------------
const onTimerStart = () => {
  timerState = TIMER_RUNNING
  port.postMessage({ action: 'TIMER-START' });
}

const onTimerStop = () => {
  port.postMessage({ action: 'TIMER-STOP' });
  timerState = TIMER_STOPPED
}

const onTimerPause = () => {
  port.postMessage({ action: 'TIMER-PAUSE' });
  timerState = TIMER_PAUSED
}

const onTimerResume = () => {
  port.postMessage({ action: 'TIMER-RESUME' });
  timerState = TIMER_RUNNING
}


// ----------------- LISTENNERS --------------------
const setTimerElementsActions = ({ onTimerStart, onTimerPause, onTimerStop }) => {
  const startTimerElem = document.getElementById('timer-start')
  startTimerElem.addEventListener('click', () => {
    onTimerStart()
    refreshTimerButtons()
    window.close()
  })

  const stopTimerElem = document.getElementById('timer-stop')
  stopTimerElem.addEventListener('click', () => {
    onTimerStop()
    refreshTimerButtons()
  })

  const pauseTimerElem = document.getElementById('timer-pause')
  pauseTimerElem.addEventListener('click', () => {
    if (timerState === TIMER_RUNNING) {
      onTimerPause()
      pauseTimerElem.innerText = 'RESUME'
    } else {
      onTimerResume()
      pauseTimerElem.innerText = 'PAUSE'
    }
    refreshTimerButtons()
  })
}

const setMenuListenners = () => {
  const pomodoroBtn = document.getElementById('pomodoro-btn')
  pomodoroBtn.addEventListener('click', () => {
    menu = POMODORO_MENU
    refreshLayout()
  })

  const timerBtn = document.getElementById('timer-btn')
  timerBtn.addEventListener('click', () => {
    menu = TIMER_MENU
    refreshLayout()
  })

}

const setSelectedIssue = (issue) => {
  port.postMessage({ action: 'SELECT-ISSUE', issue });
}

const setIssueSelectChangeListenner = () => {
  const select = document.getElementById('issues-list')
  select.addEventListener('change', (e) => {
    const issue = JSON.parse(e.target.options[e.target.selectedIndex].value)
    setSelectedIssue(issue)
  })
}

// ----------------- GET STATE (CHROME API STORAGE) --------------
chrome.storage.sync.get(['menu'], function (result) {
  menu = result.menu || TIMER_MENU
  if (!result.menu) {
    chrome.storage.sync.set({ menu });
  }

  chrome.storage.sync.get(['timerState'], function (result) {
    timerState = result.timerState
    refreshLayout()
  });
});


// ----------------- INIT ---------------------------------------
setMenuListenners()

setTimerElementsActions({
  onTimerStart,
  onTimerPause,
  onTimerStop
})

setIssueSelectChangeListenner()

getSetSelectedIssue()

getIssuesFromBoard()
