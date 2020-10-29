import { MessageAttachment } from "discord.js";
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando";
import got from "got/dist/source";
import sharp from "sharp";
import GifEncoder from "gifencoder";
import { Readable } from "stream";
import path from "path";

export default class TriggeredCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: "triggered",
      group: "fun",
      memberName: "triggered",
      description: "Trigger people",
      guildOnly: true,
    });
  }

  async run(msg: CommandoMessage) {
    const scale = 40;
    let pfpUrl: string | undefined;
    const mentioned = msg.mentions?.users?.first();
    if (mentioned) {
      pfpUrl = mentioned.displayAvatarURL();
    } else {
      pfpUrl = msg.author.displayAvatarURL();
    }

    const pfp = (await got(pfpUrl)).rawBody;

    let basePfp = await sharp(pfp).blur(2).sharpen(3);

    const imageMeta = await basePfp.metadata();

    const imageWidth = imageMeta.width ?? 128;

    const overlay = await sharp(
      path.join(__dirname, "../../assets/triggered.png")
    )
      .png({
        quality: 1,
      })
      .blur(1.2)
      .toBuffer();

    const shiftedPfps: Buffer[] = [];

    for (let i = 0; i < 10; i++) {
      const offsetX = Math.floor(Math.random() * scale);
      const offsetY = Math.floor(Math.random() * scale);

      let trimmedPfp = basePfp
        .clone()
        .extract({
          left: offsetX,
          top: offsetY,
          width: imageWidth - offsetX - Math.round(offsetX * Math.random()),
          height: imageWidth - offsetY - Math.round(offsetY * Math.random()),
        })
        .resize(128, 128)
        .composite([
          {
            input: overlay,
            gravity: "south",
          },
        ]);

      const buffer = await trimmedPfp.raw().toBuffer();

      shiftedPfps.push(buffer);
    }

    const encoder = new GifEncoder(imageWidth, imageWidth);

    shiftedPfps.forEach((shift) => {
      Readable.from(shift).pipe(
        encoder.createWriteStream({
          repeat: 0,
          delay: 100,
          quality: 1,
        })
      );
    });

    const chunks = [];
    for await (let chunk of encoder.createReadStream()) {
      chunks.push(chunk);
    }

    const out = Buffer.concat(chunks);

    const attachment = new MessageAttachment(
      out,
      `${msg.author.username}-triggered.gif`
    );

    return msg.say("", attachment);
  }
}
