import sharp from "sharp";
import path from "path";
import fs from "fs";

const CASSETTE_TEMPLATE_PATH = path.join(
  process.cwd(),
  "attached_assets",
  "generated_images",
  "cassette_tape_isolated_transparent.png"
);

const ORIGINAL_CASSETTE_PATH = path.join(
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
  const canvasWidth = 800;
  const canvasHeight = 500;
  
  const woodBackground = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 139, g: 90, b: 43, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const sleeveWidth = 340;
  const sleeveHeight = 340;
  const sleeveX = 420;
  const sleeveY = 80;
  const sleeveRotation = 5;

  const userArt = await sharp(userPhotoBuffer)
    .resize(sleeveWidth - 20, sleeveHeight - 20, {
      fit: "cover",
      position: "attention",
    })
    .png()
    .toBuffer();

  const sleeveWithBorder = await sharp({
    create: {
      width: sleeveWidth,
      height: sleeveHeight,
      channels: 4,
      background: { r: 30, g: 30, b: 35, alpha: 1 },
    },
  })
    .composite([
      {
        input: userArt,
        top: 10,
        left: 10,
      },
    ])
    .png()
    .toBuffer();

  const sleeveWithShadow = await addShadow(sleeveWithBorder, 12, 0.5);

  const rotatedSleeve = await sharp(sleeveWithShadow)
    .rotate(sleeveRotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  let cassetteBuffer: Buffer;
  if (fs.existsSync(CASSETTE_TEMPLATE_PATH)) {
    cassetteBuffer = fs.readFileSync(CASSETTE_TEMPLATE_PATH);
  } else if (fs.existsSync(ORIGINAL_CASSETTE_PATH)) {
    cassetteBuffer = fs.readFileSync(ORIGINAL_CASSETTE_PATH);
  } else {
    cassetteBuffer = await createFallbackCassette();
  }

  const cassetteWidth = 380;
  const cassetteHeight = 250;
  const cassetteX = 30;
  const cassetteY = 150;

  const resizedCassette = await sharp(cassetteBuffer)
    .resize(cassetteWidth, cassetteHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const cassetteWithShadow = await addShadow(resizedCassette, 8, 0.4);

  const composited = await sharp(woodBackground)
    .composite([
      {
        input: rotatedSleeve,
        top: sleeveY,
        left: sleeveX,
        blend: "over",
      },
      {
        input: cassetteWithShadow,
        top: cassetteY,
        left: cassetteX,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  return composited;
}

async function addShadow(
  imageBuffer: Buffer,
  shadowOffset: number,
  shadowOpacity: number
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 400;
  const height = metadata.height || 300;

  const canvasWidth = width + shadowOffset + 20;
  const canvasHeight = height + shadowOffset + 20;

  const shadowBuffer = await sharp(imageBuffer)
    .greyscale()
    .modulate({ brightness: 0 })
    .blur(8)
    .ensureAlpha(shadowOpacity)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: shadowBuffer,
        top: shadowOffset + 10,
        left: shadowOffset + 10,
      },
      {
        input: imageBuffer,
        top: 10,
        left: 10,
      },
    ])
    .png()
    .toBuffer();
}

async function createFallbackCassette(): Promise<Buffer> {
  return sharp({
    create: {
      width: 380,
      height: 250,
      channels: 4,
      background: { r: 240, g: 230, b: 210, alpha: 1 },
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
