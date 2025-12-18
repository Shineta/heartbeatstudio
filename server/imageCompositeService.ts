import sharp from "sharp";
import path from "path";
import fs from "fs";

const CASSETTE_TEMPLATE_PATH = path.join(
  process.cwd(),
  "attached_assets",
  "generated_images",
  "blank_cassette_tape_template.png"
);

export interface CompositeOptions {
  songTitle?: string;
  recipientName?: string;
}

export async function compositePhotoIntoCassette(
  userPhotoBuffer: Buffer,
  options: CompositeOptions = {}
): Promise<Buffer> {
  const templateWidth = 1456;
  const templateHeight = 816;
  
  const photoWidth = 350;
  const photoHeight = 280;
  const photoX = 950;
  const photoY = 200;
  
  const resizedPhoto = await sharp(userPhotoBuffer)
    .resize(photoWidth, photoHeight, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toBuffer();

  const photoWithBorder = await sharp({
    create: {
      width: photoWidth + 8,
      height: photoHeight + 8,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedPhoto,
        top: 4,
        left: 4,
      },
    ])
    .png()
    .toBuffer();

  const rotatedPhoto = await sharp(photoWithBorder)
    .rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  let templateBuffer: Buffer;
  if (fs.existsSync(CASSETTE_TEMPLATE_PATH)) {
    templateBuffer = fs.readFileSync(CASSETTE_TEMPLATE_PATH);
  } else {
    templateBuffer = await createFallbackTemplate(templateWidth, templateHeight);
  }

  const resizedTemplate = await sharp(templateBuffer)
    .resize(templateWidth, templateHeight, { fit: "fill" })
    .png()
    .toBuffer();

  const composited = await sharp(resizedTemplate)
    .composite([
      {
        input: rotatedPhoto,
        top: photoY,
        left: photoX,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  return composited;
}

async function createFallbackTemplate(
  width: number,
  height: number
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 245, g: 240, b: 230, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

export async function downloadImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
