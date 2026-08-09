import Image from "next/image"
import { Text } from "@medusajs/ui"

const MaxxamCTA = () => {
  return (
    <Text className="flex gap-x-2 txt-compact-small-plus items-center">
      Powered by
      <a href="https://www.maxxam.com.au" target="_blank" rel="noreferrer">
        <span className="flex gap-x-2 items-center hover:maxxam-text-yellow">
          <Image src="/logo.svg" alt="Maxxam Logo" width={20} height={20} />
          Maxxam
        </span>
      </a>
    </Text>
  )
}

export default MaxxamCTA
