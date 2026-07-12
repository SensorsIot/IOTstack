import signal
import textwrap

from deps.chars import (
  commonBottomBorder,
  commonEmptyLine,
  commonTextLine,
  commonTopBorder,
)


def issueDisplayRows(issueEntries, contentWidth=78):
  rows = []
  for serviceName, issue, issueValue in issueEntries:
    if str(issue).startswith("missingEnvironment:"):
      prefix = "%s: " % serviceName
    else:
      prefix = "%s (%s): " % (serviceName, issue)
    description = str(issueValue)
    wrapped = textwrap.wrap(
      prefix + description,
      width=max(20, contentWidth),
      subsequent_indent="  ",
      break_long_words=True,
      break_on_hyphens=False,
    ) or [prefix.rstrip()]
    rows.extend(wrapped)
  return rows


def compactIssueRows(issueEntries, contentWidth=78, maximumRows=4):
  rows = issueDisplayRows(issueEntries, contentWidth=contentWidth)
  maximumRows = max(1, maximumRows)
  if len(rows) <= maximumRows:
    return rows
  hiddenRows = len(rows) - maximumRows + 1
  return rows[:maximumRows - 1] + [
    "... %s more lines. Press [I] to view all issues." % hiddenRows
  ]


def runIssueViewer(term, renderMode, issueEntries):
  state = {
    "offset": 0,
    "render": True,
  }

  def dimensions():
    boxWidth = min(80, max(40, term.width - 2))
    visibleRows = max(1, term.height - 8)
    rows = issueDisplayRows(issueEntries, contentWidth=boxWidth - 6)
    return boxWidth, visibleRows, rows

  def render():
    boxWidth, visibleRows, rows = dimensions()
    maximumOffset = max(0, len(rows) - visibleRows)
    state["offset"] = max(0, min(state["offset"], maximumOffset))
    visible = rows[state["offset"]:state["offset"] + visibleRows]
    firstRow = state["offset"] + 1 if rows else 0
    lastRow = state["offset"] + len(visible)

    print(term.clear(), end="")
    print(term.black_on_cornsilk4(term.center("IOTstack Build Issues")))
    print(term.center(commonTopBorder(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "Issues %s-%s of %s" % (firstRow, lastRow, len(rows)),
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    for row in visible:
      print(term.center(commonTextLine(
        renderMode,
        row,
        size=boxWidth,
        paddingBefore=3,
      )))
    for unusedRow in range(visibleRows - len(visible)):
      print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "[Up/Down] Scroll  [PgUp/PgDn] Page  [Esc/Enter] Back",
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonBottomBorder(renderMode, size=boxWidth)))
    state["render"] = False

  def onResize(sig, action):
    state["render"] = True
    render()

  originalSignalHandler = signal.getsignal(signal.SIGWINCH)
  signal.signal(signal.SIGWINCH, onResize)
  try:
    with term.fullscreen():
      with term.cbreak():
        while True:
          if state["render"]:
            render()
          key = term.inkey(esc_delay=0.05)
          boxWidth, visibleRows, rows = dimensions()
          maximumOffset = max(0, len(rows) - visibleRows)
          if key.name in ("KEY_ESCAPE", "KEY_ENTER") or (
            not key.is_sequence and str(key).lower() in ("q", "i")
          ):
            return True
          if key.name == "KEY_UP":
            state["offset"] = max(0, state["offset"] - 1)
            state["render"] = True
          elif key.name == "KEY_DOWN":
            state["offset"] = min(maximumOffset, state["offset"] + 1)
            state["render"] = True
          elif key.name == "KEY_PGUP":
            state["offset"] = max(0, state["offset"] - visibleRows)
            state["render"] = True
          elif key.name == "KEY_PGDOWN":
            state["offset"] = min(maximumOffset, state["offset"] + visibleRows)
            state["render"] = True
          elif key.name == "KEY_HOME":
            state["offset"] = 0
            state["render"] = True
          elif key.name == "KEY_END":
            state["offset"] = maximumOffset
            state["render"] = True
  finally:
    signal.signal(signal.SIGWINCH, originalSignalHandler)
