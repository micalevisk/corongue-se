let isActive = true
let totalOccurrences = 0
const ELEMENT_DONE_CLASSNAME = '__micalevisk_ext_coronguese__'

const isGooglePage = document.location.hostname.startsWith('www.google.')
const isDuckDuckGoPage = document.location.hostname.startsWith('duckduckgo.')

const blacklistRegExp = (function(){
  const blacklistWordsRE = [
    'coronav[ií]rus',
    'corona\sv[ií]rus',
    'covid-?19',
    'covid',
  ]
  return new RegExp(`\\b${blacklistWordsRE.join('|')}\\b`, 'gi')
}())

const getEmoji = (function(){
  const emojis = [
    //'🦠',
    '💉',
  ]
  let i=0
  return () => emojis[i++ % emojis.length]
}())

const isValidURL = (strMaybeURL) => {
  try {
    new URL(strMaybeURL)
    return true
  } catch (_err) {
    return false
  }
}

const replaceTextsOnNode = (textNode) => {
  let occurrences = 0

  // Custom filters to prevent replace in non-valid texts node
  const isGoogleBreadcrumb = isGooglePage && textNode.nodeValue.includes(' › ')
  const isGoogleHrefContent = isGooglePage && textNode.parentNode.className.includes('HRf')
  const isURL = isValidURL(textNode.nodeValue)
  const isDDGURL = isDuckDuckGoPage && textNode.parentNode.className.includes('result__url')

  const canSearchAndReplace = !isGoogleBreadcrumb && !isGoogleHrefContent && !isURL && !isDDGURL
  if (canSearchAndReplace) {
    const replacer = (match) => {
      occurrences++
      const newValue = getEmoji()
      return `<span class="${ELEMENT_DONE_CLASSNAME}" data-modified="${newValue}" data-original="${match}"></span>`
    }

    const newValue = textNode.nodeValue.replace(blacklistRegExp, replacer)
    if (occurrences > 0) {
      const wrapperEl = document.createElement('span')
      wrapperEl.innerHTML = newValue
      textNode.replaceWith(wrapperEl) // Now this element a parent node
      wrapperEl.outerHTML = wrapperEl.innerHTML // so we can throw away the top level SPAN tag
    }
  }

  return occurrences
}

const replaceAllAndUpdateBadge = (function(){
  const tagsNameToIgnore = ['SCRIPT', 'NOSCRIPT', 'STYLE', 'SOURCE', 'TITLE', 'META']
  return () => {
    const nodeIt = document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_TEXT,
      (node) =>
          (
            !tagsNameToIgnore.includes(node.parentNode.nodeName) &&
            node.nodeValue.trim() &&
            !node.parentNode.classList.contains(ELEMENT_DONE_CLASSNAME)
          )
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    )

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
}())

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

