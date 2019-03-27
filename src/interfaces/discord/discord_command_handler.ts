import { logger } from "../../lib/logger";
import { Action } from "./actions";
import * as DiscordMessageHandler from "./discord_message_handler";
import * as DiscordMessageContext from "./discord_message_context";

/**
 * Take a content string and return the command tokens
 *
 * Example:
 *
 * Prelude: !
 * Message: !trivia c
 * Return: [trivia, c]
 *
 * Prelude:
 * Message: !trivia c
 * Return: [!trivia, c]
 *
 */
const extractCommandTokens = (prelude: string) => (
  ctx: DiscordMessageContext.MessageContext
): Array<string> => {
  let content = ctx.message.content;
  if (!content.startsWith(prelude)) {
    return [];
  }

  // Remove the prelude
  let re = new RegExp(`^(${prelude})`);
  let contentWithoutPrelude = ctx.message.content.replace(re, "");

  return contentWithoutPrelude.split(" ");
};

export const commandHandler = (
  command_prelude: string,
  commands: Array<DiscordMessageHandler.DiscordCommand>
) => (ctx: DiscordMessageContext.MessageContext): Array<Action> => {
  logger.trace({ commands, ctx, command_prelude }, "commandHandler");
  let tokens = extractCommandTokens(command_prelude)(ctx);

  if (tokens === []) {
    // Message was not a command
    return [];
  }

  let command = commands.find(c => c.name.includes(tokens[0] as string));
  if (!command) {
    // Message was an invalid command
    return [];
  }

  // No subcommands, run handler
  if (!command.subcommands || tokens.length === 1) {
    return command.handler(ctx);
  }

  let newContext = {
    ...ctx,
    message: {
      ...ctx.message,
      content: tokens.slice(1).join(" ")
    }
  };
  return commandHandler("", command.subcommands)(newContext);
};
