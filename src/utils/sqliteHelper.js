const normalizeDate = (date) => {
  if (!date) {
    return new Date();
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date supplied.');
  }

  return parsed;
};

const formatDateForSqlite = (date) => {
  const normalized = normalizeDate(date);
  return normalized.toISOString().slice(0, 19).replace('T', ' ');
};

const runStatement = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(this);
    });
  });

module.exports = {
  formatDateForSqlite,
  runStatement,
};
