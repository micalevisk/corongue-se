const contexts = {
  working: {
    title: 'Estou tentando deixar esta página livre do CORONA!',
    color: [0, 0, 0, 0],
    icon: {
      '50': 'icons/icon50.green.png',
      '100': 'icons/icon100.green.png'
    },
  },

  infected: {
    title: 'Esta página estava infectada! 😷',
    color: [180, 0, 0, 255],
    icon: {
      '50': 'icons/icon50.green.png',
      '100': 'icons/icon100.green.png'
    },
  },

  safe: {
    title: '👨‍⚕️ Esta página está livre do coronga',
    color: [0, 100, 0, 255],
    icon: {
      '50': 'icons/icon50.green.png',
      '100': 'icons/icon100.green.png'
    },
  },

  disabled: {
    title: 'Esta página não está segura!',
    color: [0, 0, 0, 0],
    icon: {
      '50': 'icons/icon50.png',
      '100': 'icons/icon100.png'
    },
  }
}

// @see https://developer.chrome.com/extensions/browserAction
// @see https://developer.chrome.com/extensions/runtime
// @see https://developer.chrome.com/extensions/tabs
const { browserAction, runtime, tabs } = chrome

const updateTrackerCount = (tabId, text, context) => {
  const { color, title, icon } = context

  browserAction.setBadgeBackgroundColor({ tabId, color })
  browserAction.setBadgeText({ tabId, text })
  browserAction.setTitle({ tabId, title })
  browserAction.setIcon({ tabId, path: icon })
}

const tracking = (tabId) =>
  updateTrackerCount(tabId, '', contexts.working) 

const setTrackerCount = (tabId, count) => (typeof count === 'number') &&
  updateTrackerCount(tabId,
    count.toString(),
    (count > 0) ? contexts.infected : contexts.safe)

const disable = (tabId) =>
  updateTrackerCount(tabId, '', contexts.disabled)


// @see https://developer.chrome.com/apps/runtime#event-onMessage
const onMessageHandler = ({ action, count }, sender/*, sendResponse*/) => {
  const tabId = sender.tab.id
  switch (action) {
    case 'tracking': 
      tracking(tabId)
      break
    case 'set-tracker-count':
      setTrackerCount(tabId, count)
      break
    case 'disable':
      disable(tabId)
  }
}

const toggleExtOnTab = (tab) => {
  const responseCallback = ({ isActive, count }) => {
    if (isActive) {
      setTrackerCount(tab.id, count)
    } else {
      disable(tab.id)
    }
  }
  tabs.sendMessage(tab.id, 'toggle-tab', responseCallback)
}

runtime.onMessage.addListener(onMessageHandler)

browserAction.onClicked.addListener(toggleExtOnTab)

