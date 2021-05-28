const crypto = require('crypto');

const generatePassword = ({ chars, minLength, maxLength } = {}) => {
  const useChars = chars ?? "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz_"; // Doesn't have O, I or l
  const useMinLength = minLength ?? 16;
  const useMaxLength = maxLength ?? 24;

  const passwordLength = Math.floor(Math.random() * (useMaxLength - useMinLength + 1) + useMinLength);
  const generatedPassword = Array(passwordLength)
    .fill('')
    .map(() => useChars[Math.floor(Math.random() * (useChars.length + 1))])
    .join('');

  return generatedPassword;
};

const generateFileOrFolderName = ({ chars, minLength, maxLength } = {}) => {
  const useChars = chars ?? "0123456789abcdefghijkmnopqrstuvwxyz_";
  const firstChars = useChars.replace(/[^a-z]+/gi, '').split(''); // Only allow letters

  // - 1 since first letter is generated outside of map()
  const useMinLength = (minLength ?? 4) - 1;
  const useMaxLength = (maxLength ?? 16) - 1;

  const nameLength = Math.floor(Math.random() * (useMaxLength - useMinLength + 1) + useMinLength);
  let generatedName = Array(nameLength)
    .fill('')
    .map(() => useChars[Math.floor(Math.random() * (useChars.length + 1))])
    .join('');

    generatedName = firstChars[Math.floor(Math.random() * (firstChars.length + 1))] + generatedName;

  return generatedName;
};

const generateAlphanumeric = ({ chars, minLength, maxLength } = {}) => {
  const useChars = chars ?? "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const useMinLength = minLength ?? 8;
  const useMaxLength = maxLength ?? 16;

  const stringLength = Math.floor(Math.random() * (useMaxLength - useMinLength + 1) + useMinLength);
  const generatedString = Array(stringLength)
    .fill('')
    .map(() => useChars[Math.floor(Math.random() * (useChars.length + 1))])
    .join('');

  return generatedString;
};

const generateRandomPort = ({ minPort, maxPort } = {}) => {
  const useMinPort = minPort ?? 1001;
  const useMaxPort = maxPort ?? 65534;

  return Math.floor(Math.random() * (useMaxPort - useMinPort + 1) + useMinPort)
};

module.exports = {
  generatePassword,
  generateFileOrFolderName,
  generateAlphanumeric,
  generateRandomPort
};
