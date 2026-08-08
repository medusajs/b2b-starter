"use client"

import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Heading } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-neutral-100">
      <Image
        src="/20190426_History_building.webp"
        alt="Maxxam Building"
        layout="fill"
        quality={100}
        priority
      />
      <div className="absolute inset-0 z-1 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <p className="text-neutral-600 text-xs uppercase">
            Total IT Management
          </p>

          <Heading
            level="h1"
            className="text-6xl leading-10 text-ui-fg-base font-normal mt-10 mb-5"
          >
            Your trusted IT partner since 1993
          </Heading>

          <p className="leading-10 text-ui-fg-subtle font-normal text-lg">
            We power the systems that keep your business moving — quietly, reliably, and with precision.
          </p>
        </span>
        <a href="https://www.maxxam.com.au" target="_blank">
          <Button variant="secondary" className="rounded-xs">
            <Image src="/favicon.webp" alt="Maxxam Logo" width={20} height={20} />
            Maxxam Homepage
            <ArrowUpRightOnBox />
          </Button>
        </a>
      </div>
    </div>
  )
}

export default Hero
