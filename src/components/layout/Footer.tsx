import Link from 'next/link'
import { Coins, Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-black/10 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              <span className="text-xl font-bold">Assetra</span>
            </div>
            <p className="text-sm text-black/60">
              Bridging real-world assets to blockchain technology
            </p>
            <div className="flex gap-4">
              <Link
                href="https://twitter.com/assetra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/60 transition-colors hover:text-black"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/assetra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/60 transition-colors hover:text-black"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/marketplace" className="text-black/60 hover:text-black">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/tokenize" className="text-black/60 hover:text-black">
                  Tokenize Asset
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-black/60 hover:text-black">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/docs" className="text-black/60 hover:text-black">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-black/60 hover:text-black">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-black/60 hover:text-black">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-black/60 hover:text-black">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-black/60 hover:text-black">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-black/10 pt-8 text-center text-sm text-black/60">
          <p>&copy; {new Date().getFullYear()} Assetra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
