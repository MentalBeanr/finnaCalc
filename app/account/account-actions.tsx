"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { MaterialIcon } from "@/components/ds/material-icon"

/** Client-side account actions (sign out) that act on the Supabase session. */
export function AccountActions() {
    const router = useRouter()
    const { signOut } = useAuth()

    const handleSignOut = () => {
        signOut()
        router.push("/")
        router.refresh()
    }

    return (
        <div className="flex items-center gap-stack-md pt-stack-sm">
            <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-error/40 hover:text-error transition-colors"
            >
                <MaterialIcon name="logout" size={16} />
                Sign Out
            </button>
        </div>
    )
}
