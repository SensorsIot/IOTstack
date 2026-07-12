def terminalSupportsMenu(terminalWidth, terminalHeight, minimumWidth=82, minimumHeight=30):
  return terminalWidth >= minimumWidth and terminalHeight >= minimumHeight


def pageSizeForTerminal(terminalHeight, reservedLines=22):
  return max(1, terminalHeight - reservedLines)


def issuePanelHeight(issueRows, fixedRows=7):
  if issueRows <= 0:
    return 0
  return fixedRows + issueRows


def serviceOptionsMessage(hasOptions, isSelected):
  if not hasOptions:
    return "This container has no configurable options."
  if not isSelected:
    return "Select this container with [Space] before opening its options."
  return None


def paginationStart(selection, currentStart, pageSize):
  pageSize = max(1, pageSize)
  if selection >= currentStart + pageSize:
    return selection - pageSize + 1
  if selection < currentStart:
    return selection
  return currentStart
