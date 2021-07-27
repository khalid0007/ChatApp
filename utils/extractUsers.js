exports.extractUsers = (msg) => {
  userList = [];

  userList = (msg.match(/@[\w\d]+\s?/g) || []).map((el) => el.slice(1).trim());

  return userList;
};
