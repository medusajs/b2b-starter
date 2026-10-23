"use client"

import { retrieveSession, StorefrontSession } from "@/lib/data/session"
import { usePathname } from "next/navigation"
import type { PropsWithChildren } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type SessionContextValue = StorefrontSession & {
  refreshSession: () => Promise<void>
}

const EMPTY_SESSION: StorefrontSession = {
  customer: null,
  cart: null,
  freeShippingPrices: [],
}

const SessionContext = createContext<SessionContextValue>({
  ...EMPTY_SESSION,
  refreshSession: async () => {},
})

/**
 * Provides the shopper's cart and customer. Statically rendered pages can't
 * read cookies, so when the server sent no session it's loaded in the browser.
 */
export function SessionProvider({
  session: serverSession,
  children,
}: PropsWithChildren<{ session: StorefrontSession }>) {
  const pathname = usePathname()
  // Tagged with the server session it replaced, so a newer server render wins.
  const [clientSession, setClientSession] = useState<{
    session: StorefrontSession
    replaces: StorefrontSession
  } | null>(null)
  const hasServerSession = !!(serverSession.cart || serverSession.customer)

  const refreshSession = useCallback(async () => {
    const session = await retrieveSession().catch(() => null)
    if (session) {
      setClientSession({ session, replaces: serverSession })
    }
  }, [serverSession])

  useEffect(() => {
    if (!hasServerSession) {
      refreshSession()
    }
  }, [hasServerSession, pathname, refreshSession])

  const session =
    clientSession?.replaces === serverSession
      ? clientSession.session
      : hasServerSession
      ? serverSession
      : EMPTY_SESSION

  return (
    <SessionContext.Provider value={{ ...session, refreshSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
