"use client"

import { ArrowLongRight } from "@medusajs/icons"
import { Heading } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import Image from "next/image"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

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
          <p className="text-neutral-600 text-md maxxam-text-grey">
            Total IT Management
          </p>

          <Heading
            level="h1"
            className="text-6xl leading-10 text-ui-fg-base font-normal mt-10 mb-5"
          >
            Your trusted IT partner since 1993
          </Heading>

          <p className="leading-10 maxxam-text-grey font-normal text-lg">
            We power the systems that keep your business moving — quietly, reliably, and with precision.
          </p>
        </span>

        <LocalizedClientLink href="/store" className="maxxam-bg-grey p-4 flex items-center gap-x-2 rounded-xl txt-compact-xlarge-plus hover:maxxam-text-yellow uppercase" >
            <Image src="/logo.svg" alt="Maxxam Logo" width={30} height={30} />
            See our products and services <ArrowLongRight />
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Hero
