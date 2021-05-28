const pad = (str, size, withChar = "0", atEnd = false) => {
  let s = str + "";
  if (atEnd) {
    while (s.length < size) {
      s = s + withChar;
    }
  } else {
    while (s.length < size) {
      s = withChar + s;
    }
  }
  
  return s;
};

module.exports = {
  pad
};
