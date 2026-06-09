"use client"

import { ArrowLeftMini, ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, IconButton } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const thumbnail = product?.thumbnail
  const images = useMemo(() => product?.images || [], [product])

  const [selectedImage, setSelectedImage] = useState(
    images[0] || {
      url: thumbnail,
      id: "thumbnail",
    }
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleArrowClick = useCallback(
    (direction: "left" | "right") => {
      if (
        images.length === 0 ||
        (selectedImageIndex === 0 && direction === "left") ||
        (selectedImageIndex === images.length - 1 && direction === "right")
      ) {
        return
      }

      if (direction === "left") {
        setSelectedImageIndex((prev) => prev - 1)
        setSelectedImage(images[selectedImageIndex - 1])
      } else {
        setSelectedImageIndex((prev) => prev + 1)
        setSelectedImage(images[selectedImageIndex + 1])
      }
    },
    [images, selectedImageIndex]
  )

  const handleImageClick = useCallback(
    (image: HttpTypes.StoreProductImage) => {
      setSelectedImage(image)
      setSelectedImageIndex(images.findIndex((img) => img.id === image.id))
    },
    [images]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) {
        return
      }

      if (e.key === "ArrowLeft") {
        handleArrowClick("left")
      } else if (e.key === "ArrowRight") {
        handleArrowClick("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleArrowClick])

  return (
    <div className="flex flex-col items-center bg-white rounded-xl border border-black/5 shadow-sm p-6 gap-6 w-full">
      <div
        className="relative aspect-square w-full overflow-hidden"
        id={selectedImage.id}
      >
        {!!selectedImage.url && (
          <Image
            src={selectedImage.url}
            priority
            className="object-contain p-8 small:p-12"
            alt={(selectedImage.metadata?.alt as string) || ""}
            fill
            sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          />
        )}
      </div>
      <div className="flex small:flex-row flex-col-reverse gap-y-3 justify-between w-full">
        {images.length > 1 && (
          <div className="flex flex-row gap-x-2 self-end small:self-auto">
            <IconButton
              disabled={selectedImageIndex === 0}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("left")}
            >
              <ArrowLeftMini />
            </IconButton>
            <IconButton
              disabled={selectedImageIndex === images.length - 1}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("right")}
            >
              <ArrowRightMini />
            </IconButton>
          </div>
        )}
        <ul className="flex flex-row gap-x-3 overflow-x-auto">
          {images.map((image, index) => (
            <li
              key={image.id}
              className={clx(
                "flex items-center justify-center aspect-square w-16 h-16 rounded-lg border bg-white p-2 cursor-pointer transition-colors",
                index === selectedImageIndex
                  ? "border-benzs-red"
                  : "border-black/10 hover:border-benzs-ink/40"
              )}
              onClick={() => handleImageClick(image)}
              role="button"
            >
              <Image
                src={image.url}
                alt={(image.metadata?.alt as string) || ""}
                height={56}
                width={56}
                className={clx(
                  index === selectedImageIndex ? "opacity-100" : "opacity-60",
                  "hover:opacity-100 object-contain"
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageGallery
