import * as TelegramBot from "node-telegram-bot-api";
import Cetriolino from "cetriolino";

const removeQuote = (str: string, db: Cetriolino): boolean => {
  const keys = db.keys();
  for (let k in keys) {
    let quote = db.get(keys[k]);
    if (quote === str) {
      db.remove(keys[k]);
      return true;
    }
  }
  return false;
};

export default (bot: TelegramBot, db: Cetriolino) => (
  msg: TelegramBot.Message
): void => {
  let removed;
  if (msg.reply_to_message.text && msg.reply_to_message.text.length !== 0) {
    removed = removeQuote(msg.reply_to_message.text, db);
  }

  removed
    ? bot.sendMessage(msg.chat.id, "Quote removed!")
    : bot.sendMessage(msg.chat.id, "Couldn't remove quote!");
};
