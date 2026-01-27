// From blueprint:javascript_object_storage
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async uploadBase64Image(base64Data: string, directory: string, prefix: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${directory}/${prefix}-${randomUUID()}.png`;
    const privateObjectDir = this.getPrivateObjectDir();
    const fullPath = `${privateObjectDir}/${filename}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(buffer, {
      contentType: 'image/png',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    return `/public-objects/${objectName}`;
  }

  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/${filename}-${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    return `/public-objects/${objectName}`;
  }

  async uploadAudioFromUrl(audioUrl: string, prefix: string = 'song'): Promise<string> {
    console.log(`[ObjectStorage] uploadAudioFromUrl called with prefix: ${prefix}`);
    console.log(`[ObjectStorage] Audio source URL: ${audioUrl.substring(0, 80)}...`);
    
    try {
      // Step 1: Download the audio
      console.log(`[ObjectStorage] Step 1: Downloading audio...`);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
      }
      console.log(`[ObjectStorage] Download successful, status: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[ObjectStorage] Audio buffer size: ${buffer.length} bytes`);
      
      if (buffer.length < 1000) {
        throw new Error(`Audio file too small (${buffer.length} bytes) - likely invalid`);
      }
      
      // Step 2: Prepare upload path
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const objectId = randomUUID();
      const filename = `audio/${prefix}-${objectId}.mp3`;
      
      console.log(`[ObjectStorage] Step 2: Getting private object dir...`);
      const privateObjectDir = this.getPrivateObjectDir();
      console.log(`[ObjectStorage] Private dir: ${privateObjectDir}`);
      
      const fullPath = `${privateObjectDir}/${filename}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      console.log(`[ObjectStorage] Bucket: ${bucketName}, Object: ${objectName}`);
      
      // Step 3: Upload to storage
      console.log(`[ObjectStorage] Step 3: Uploading to bucket...`);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(buffer, {
        contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      const publicUrl = `/public-objects/${objectName}`;
      console.log(`[ObjectStorage] SUCCESS! Audio uploaded: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      console.error(`[ObjectStorage] FAILED to upload audio: ${error.message}`);
      console.error(`[ObjectStorage] Error stack: ${error.stack}`);
      throw error;
    }
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/public-objects/")) {
      throw new ObjectNotFoundError();
    }
    const objectName = objectPath.slice("/public-objects/".length);
    const privateObjectDir = this.getPrivateObjectDir();
    const { bucketName } = parseObjectPath(privateObjectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  async streamObject(objectPath: string, res: Response): Promise<void> {
    console.log(`[ObjectStorage] Streaming object: ${objectPath}`);
    
    if (!objectPath.startsWith("/public-objects/")) {
      throw new ObjectNotFoundError();
    }
    
    const objectName = objectPath.slice("/public-objects/".length);
    const privateObjectDir = this.getPrivateObjectDir();
    const { bucketName } = parseObjectPath(privateObjectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    
    const [exists] = await objectFile.exists();
    if (!exists) {
      console.error(`[ObjectStorage] Object not found: ${objectName}`);
      throw new ObjectNotFoundError();
    }
    
    // Get metadata for content-type and size
    const [metadata] = await objectFile.getMetadata();
    const contentType = metadata.contentType || 'audio/mpeg';
    const contentLength = metadata.size;
    
    console.log(`[ObjectStorage] Streaming ${contentLength} bytes, type: ${contentType}`);
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Stream the file to response
    const readStream = objectFile.createReadStream();
    readStream.pipe(res);
    
    return new Promise((resolve, reject) => {
      readStream.on('end', () => {
        console.log(`[ObjectStorage] Stream completed for: ${objectName}`);
        resolve();
      });
      readStream.on('error', (err) => {
        console.error(`[ObjectStorage] Stream error:`, err);
        reject(err);
      });
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}
