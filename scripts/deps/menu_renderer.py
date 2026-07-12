def terminalSupportsMenu(terminalWidth, terminalHeight, minimumWidth=82, minimumHeight=30):
  return terminalWidth >= minimumWidth and terminalHeight >= minimumHeight


def pageSizeForTerminal(terminalHeight, reservedLines=22):
  return max(1, terminalHeight - reservedLines)


def paginationStart(selection, currentStart, pageSize):
  pageSize = max(1, pageSize)
  if selection >= currentStart + pageSize:
    return selection - pageSize + 1
  if selection < currentStart:
    return selection
  return currentStart
