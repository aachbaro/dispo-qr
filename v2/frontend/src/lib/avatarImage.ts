export interface LoadedAvatarImage {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface AvatarTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface AvatarRenderMetrics {
  renderedWidth: number;
  renderedHeight: number;
  translateX: number;
  translateY: number;
}

const MAX_SOURCE_FILE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 220 * 1024;
const OUTPUT_SIZES = [640, 512, 384, 320];
const OUTPUT_QUALITIES = [0.86, 0.78, 0.72, 0.64, 0.56];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Impossible de lire cette image."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image non prise en charge."));
    image.src = source;
  });
}

function getOffsetBounds(
  width: number,
  height: number,
  viewportSize: number,
  zoom: number
): { maxX: number; maxY: number; renderedWidth: number; renderedHeight: number } {
  const baseScale = Math.max(viewportSize / width, viewportSize / height);
  const safeZoom = clamp(zoom, 1, 3);
  const renderedWidth = width * baseScale * safeZoom;
  const renderedHeight = height * baseScale * safeZoom;

  return {
    maxX: Math.max(0, (renderedWidth - viewportSize) / 2),
    maxY: Math.max(0, (renderedHeight - viewportSize) / 2),
    renderedWidth,
    renderedHeight,
  };
}

function estimateDataUrlBytes(dataUrl: string): number {
  const [, payload = ""] = dataUrl.split(",", 2);
  const normalized = payload.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

export async function loadAvatarFile(file: File): Promise<LoadedAvatarImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisir un fichier image valide.");
  }

  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error("Image trop volumineuse. Rester sous 12 Mo avant compression.");
  }

  const dataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(dataUrl);

  return {
    dataUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export function getAvatarRenderMetrics(
  image: LoadedAvatarImage,
  viewportSize: number,
  transform: AvatarTransform
): AvatarRenderMetrics {
  const safeViewportSize = Math.max(1, viewportSize);
  const bounds = getOffsetBounds(image.width, image.height, safeViewportSize, transform.zoom);
  const offsetRatioX = clamp(transform.offsetX, -100, 100) / 100;
  const offsetRatioY = clamp(transform.offsetY, -100, 100) / 100;

  return {
    renderedWidth: bounds.renderedWidth,
    renderedHeight: bounds.renderedHeight,
    translateX: bounds.maxX * offsetRatioX,
    translateY: bounds.maxY * offsetRatioY,
  };
}

export async function renderAvatarUploadData(
  image: LoadedAvatarImage,
  transform: AvatarTransform
): Promise<string> {
  const source = await loadImageElement(image.dataUrl);
  let bestDataUrl = image.dataUrl;

  for (const outputSize of OUTPUT_SIZES) {
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Impossible de préparer l'image.");
    }

    const metrics = getAvatarRenderMetrics(image, outputSize, transform);
    const originX = (outputSize - metrics.renderedWidth) / 2 + metrics.translateX;
    const originY = (outputSize - metrics.renderedHeight) / 2 + metrics.translateY;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);
    context.drawImage(source, originX, originY, metrics.renderedWidth, metrics.renderedHeight);

    for (const quality of OUTPUT_QUALITIES) {
      const candidate = canvas.toDataURL("image/jpeg", quality);
      bestDataUrl = candidate;
      if (estimateDataUrlBytes(candidate) <= MAX_OUTPUT_BYTES) {
        return candidate;
      }
    }
  }

  return bestDataUrl;
}
