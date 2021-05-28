const { pad } = require('./pad');

const formatDate = (currentDate) => {
  const useDate = Number.isFinite(Date.parse(currentDate)) ? currentDate : new Date();

  return `${pad(useDate.getFullYear(), 4)}-${pad((useDate.getMonth() + 1), 2)}-${pad(useDate.getDate(), 2)}T${pad(useDate.getHours(), 2)}-${pad(useDate.getMinutes(), 2)}-${pad(useDate.getSeconds(), 2)}`;
};

module.exports = {
  formatDate
};
