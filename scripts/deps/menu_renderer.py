def terminalSupportsMenu(terminalWidth, terminalHeight, minimumWidth=82, minimumHeight=30):
  return terminalWidth >= minimumWidth and terminalHeight >= minimumHeight


def paginationSizes(terminalHeight, reservedLines=22, collapsedSize=10):
  availableSize = max(1, terminalHeight - reservedLines)
  return [min(collapsedSize, availableSize), availableSize]


def paginationStart(selection, currentStart, pageSize):
  pageSize = max(1, pageSize)
  if selection >= currentStart + pageSize:
    return selection - pageSize + 1
  if selection < currentStart:
    return selection
  return currentStart
