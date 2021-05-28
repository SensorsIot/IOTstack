const byName = (formatString, replacements) => Object.keys(replacements).reduce(
  (result, name) => result.replace(`{$${name}}`, replacements[name]),
  formatString || ''
);

module.exports = {
  byName
};