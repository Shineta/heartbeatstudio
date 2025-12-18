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

  // Use "contain" to show the ENTIRE image without cropping (important for logos with text)
  const userArt = await sharp(userPhotoBuffer)
    .resize(sleeveWidth - 20, sleeveHeight - 20, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for logos
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

  // Create text label for cassette
  const textLabel = await createCassetteLabel(
    options.songTitle || "My Song",
    options.recipientName || ""
  );

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
      {
        input: textLabel,
        top: cassetteY + 60,
        left: cassetteX + 75,
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

async function createCassetteLabel(
  songTitle: string,
  recipientName: string
): Promise<Buffer> {
  const labelWidth = 220;
  const labelHeight = 70;
  
  // Truncate text if too long
  const truncatedTitle = songTitle.length > 20 ? songTitle.substring(0, 18) + "..." : songTitle;
  const forText = recipientName ? `For "${recipientName}"` : "";
  const truncatedFor = forText.length > 24 ? forText.substring(0, 22) + "..." : forText;
  
  // Create SVG with text
  const svgText = `
    <svg width="${labelWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1a1a1a; }
        .recipient { font-family: Arial, sans-serif; font-size: 11px; fill: #333333; font-style: italic; }
      </style>
      <text x="${labelWidth / 2}" y="28" text-anchor="middle" class="title">${escapeXml(truncatedTitle)}</text>
      <text x="${labelWidth / 2}" y="50" text-anchor="middle" class="recipient">${escapeXml(truncatedFor)}</text>
    </svg>
  `;
  
  return sharp(Buffer.from(svgText))
    .png()
    .toBuffer();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function downloadImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
