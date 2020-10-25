import dotenv from "dotenv";
dotenv.config();

import { CommandoClient } from "discord.js-commando";
import * as util from "./util";
import { Environment, Configuration } from "./types";
import path from "path";
import got from "got";
import fs from "fs";

export let env: Environment;
export let config: Configuration;

// init is called before the main function to setup configurations
// There are more concise ways to do this, but this is more readable
init().then(main);

async function init() {
  env = {
    botToken: process.env.BOT_TOKEN!,
    tenorToken: process.env.TENOR_TOKEN!,
    config: process.env.CONFIG_URL!,
    prefix: process.env.PREFIX ?? "!",
  };

  if (!env.botToken || !env.config) {
    console.error("BOT_TOKEN and/or CONFIG_URL are not defined.");
    process.exit();
  }

  try {
    if (util.isURL(env.config)) {
      const response = await got.get(env.config);
      config = JSON.parse(response.body);
    } else {
      config = JSON.parse(
        fs.readFileSync(path.join(__dirname, env.config)).toString()
      );
    }
  } catch (error) {
    console.error(`Unable to load config file. ${error}`);
    process.exit();
  }
}

function main() {
  const client = new CommandoClient({
    commandPrefix: env.prefix,
    owner: config.owners,
  });

  client.once("ready", () => {
    console.log("Rarin' to go!");
  });

  client.registry
    .registerGroups([["utils", "Yanno, useful stuff"]])
    .registerGroups([["fun", "Definitely not fun"]])
    .registerDefaults()
    .registerCommandsIn({
      // read all the commands that end in js or ts.
      // basically, a hack to work around https://github.com/discordjs/Commando/issues/297
      filter: /^([^.].*)\.(js|ts)$/,
      dirname: path.join(__dirname, "commands"),
    });

  client.login(env.botToken);
}
