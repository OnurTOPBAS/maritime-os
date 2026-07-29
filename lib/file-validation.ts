export const FILE_VALIDATION = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"],
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_VALIDATION.maxSize) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${FILE_VALIDATION.maxSize / (1024 * 1024)}MB olmalıdır.`,
    }
  }

  // Check file type
  if (!FILE_VALIDATION.allowedTypes.includes(file.type)) {
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !FILE_VALIDATION.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Desteklenmeyen dosya türü. İzin verilen: ${FILE_VALIDATION.allowedExtensions.join(", ")}`,
      }
    }
  }

  return { valid: true }
}

export function getFileThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image file"))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Create thumbnail (max 200x200)
        const maxSize = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL())
      }
      img.onerror = () => reject(new Error("Could not load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}
