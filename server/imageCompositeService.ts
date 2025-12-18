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
  
  const photoInnerWidth = 320;
  const photoInnerHeight = 320;
  
  const polaroidPaddingSide = 16;
  const polaroidPaddingTop = 16;
  const polaroidPaddingBottom = 50;
  
  const polaroidWidth = photoInnerWidth + (polaroidPaddingSide * 2);
  const polaroidHeight = photoInnerHeight + polaroidPaddingTop + polaroidPaddingBottom;
  
  const resizedPhoto = await sharp(userPhotoBuffer)
    .resize(photoInnerWidth, photoInnerHeight, {
      fit: "cover",
      position: "attention",
    })
    .png()
    .toBuffer();

  const shadowOffset = 8;
  const shadowBlur = 15;
  const canvasWidth = polaroidWidth + shadowOffset + shadowBlur * 2;
  const canvasHeight = polaroidHeight + shadowOffset + shadowBlur * 2;
  
  const shadowBuffer = await sharp({
    create: {
      width: polaroidWidth,
      height: polaroidHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.4 },
    },
  })
    .blur(shadowBlur)
    .png()
    .toBuffer();

  const polaroidBuffer = await sharp({
    create: {
      width: polaroidWidth,
      height: polaroidHeight,
      channels: 4,
      background: { r: 252, g: 250, b: 245, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedPhoto,
        top: polaroidPaddingTop,
        left: polaroidPaddingSide,
      },
    ])
    .png()
    .toBuffer();

  const polaroidWithShadow = await sharp({
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
        top: shadowBlur + shadowOffset,
        left: shadowBlur + shadowOffset,
      },
      {
        input: polaroidBuffer,
        top: shadowBlur,
        left: shadowBlur,
      },
    ])
    .png()
    .toBuffer();

  const rotatedPolaroid = await sharp(polaroidWithShadow)
    .rotate(8, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

  const photoX = 980;
  const photoY = 180;

  const composited = await sharp(resizedTemplate)
    .composite([
      {
        input: rotatedPolaroid,
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
