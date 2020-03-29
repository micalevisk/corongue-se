let isActive = true
let totalOccurrences = 0

const blacklistRegexes = [
  'coronav[ií]rus',
  'corona\sv[ií]rus',
  'covid-?19',
  'covid',
]
const blacklistRegExp = new RegExp(`\\b${blacklistRegexes.join('|')}\\b`, 'gi')

const isGooglePage = document.location.origin.includes('.google.')

const getEmoji = (function(){
  const emojis = [
    //'🦠',
    '💉',
  ]
  let i=0
  return () => emojis[i++ % emojis.length]    
}())


const replaceTextsOnNode = (textNode) => {
  let occurrences = 0

  // Custom filters to prevent replace
  const isGoogleBreadcrumb = isGooglePage && textNode.nodeValue.includes(' › ') 
  const isGoogleHrefContent = isGooglePage && textNode.parentNode.className.includes('HRf')

  const canSearchAndReplace = !isGoogleBreadcrumb && !isGoogleHrefContent
  if (canSearchAndReplace) {
    const replacer = (match) => {
      occurrences++
      const newValue = getEmoji()
      return `<span class="__micalevisk_ext_coronguese__" data-modified="${newValue}" data-original="${match}"></span>`
    }

    const newValue = textNode.nodeValue.replace(blacklistRegExp, replacer)
    if (occurrences > 0) {
      const wrapperEl = document.createElement('span')
      wrapperEl.innerHTML = newValue
      textNode.replaceWith(wrapperEl) // Now this element has some parent node
      wrapperEl.outerHTML = wrapperEl.innerHTML // so we can throw away the top level SPAN tag
    }
  }
  
  return occurrences
}

const replaceAllAndUpdateBadge = () => {
  const nodeIt = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_TEXT,
    (node) =>
        (
          !node.parentNode.nodeName.endsWith('SCRIPT') &&
          node.nodeValue.trim() &&
          !node.parentNode.classList.contains('__micalevisk_ext_coronguese__')
        )
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT
  );

  while (nodeIt.nextNode()) {
    totalOccurrences += replaceTextsOnNode(nodeIt.referenceNode)
  }

  if (isActive) {
    chrome.runtime.sendMessage({
      action: 'set-tracker-count',
      count: totalOccurrences,
    })
  }
}

const toggleVisibility = (function(){ 
  const attrSources = ['data-original', 'data-modified']
  return (isActive) =>
    document.documentElement.style.setProperty('--coronguese-source', attrSources[+isActive]) 
}())

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === 'toggle-tab') {
    isActive = !isActive
    sendResponse({ isActive, count: totalOccurrences })
    toggleVisibility(isActive)
  }
})

document.body.addEventListener('transitionend', ({ isTrusted }) =>
  isTrusted && replaceAllAndUpdateBadge(), true)


replaceAllAndUpdateBadge()

