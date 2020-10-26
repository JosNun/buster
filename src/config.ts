import { Environment, Configuration } from "./types";
import { ConfigNotFoundError } from "./models";
import { isURL } from "./util";
import dotenv from "dotenv";
import path from "path";
import got from "got";
import fs from "fs";

export let env: Environment;
export let config: Configuration;

export async function getConfig() {
  dotenv.config();

  env = {
    botToken: process.env.BOT_TOKEN!,
    tenorToken: process.env.TENOR_TOKEN!,
    config: process.env.CONFIG_URL!,
    prefix: process.env.PREFIX ?? "!",
  };

  if (!env.botToken || !env.config) {
    throw new ConfigNotFoundError(
      "BOT_TOKEN and/or CONFIG_URL are not defined."
    );
  }

  if (isURL(env.config)) {
    const response = await got.get(env.config);
    config = JSON.parse(response.body);
  } else {
    config = JSON.parse(
      fs.readFileSync(path.join(__dirname, env.config)).toString()
    );
  }
}
