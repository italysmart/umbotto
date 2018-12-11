const axios = require("axios");
const utils = require("./utils");
const cfg = require("../config");

module.exports = (bot, markovStream) => async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const query = match[1]; // the captured "whatever"
  markovStream.write(match.input + "\n");
  // from https://cse.google.com/
  const baseApi = "https://www.googleapis.com/customsearch/v1";

  const params = {
    q: query,
    cx: cfg.googleCseToken,
    key: cfg.googleApiToken,
    searchType: "image"
  };

  try {
    const response = await axios.get(baseApi, { params });

    if (!response.data.items || response.data.items.length === 0) {
      bot.sendMessage(msg.chat.id, "No photo found.");
    } else {
      const item = utils.randomChoice(response.data.items);
      bot.sendPhoto(msg.chat.id, item.link);
    }
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      bot.sendMessage(msg.chat.id, error.response.status);
    }
    console.error(error.response);
  }
};
