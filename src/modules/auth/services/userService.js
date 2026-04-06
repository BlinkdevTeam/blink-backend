"use strict";

const { User } = require("../models");

const verifyUserEmailDomain = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.email.includes("@blinkcreativestudio")) {
    return true;
  }

  return false;
};

module.exports = {
  verifyUserEmailDomain,
};
