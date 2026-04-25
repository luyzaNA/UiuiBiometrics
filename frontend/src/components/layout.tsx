import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <div className="fixed top-0 left-0 right-0 z-[100] w-full">
                <Header />
            </div>
            <main className="flex-auto pt-24">
                {children}
            </main>
            <div className="relative z-10 w-full border-t bg-white dark:bg-slate-900">
                <Footer />
            </div>
        </div>
    )
}