import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ArrowRight, Shield, Coins, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black to-black/90 text-white py-20">
        <Container className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Tokenize Real-World Assets
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Bridge tangible assets to the blockchain. Trade real estate, commodities,
            and collectibles with the power of Web3 on Base.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tokenize"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-8 py-3 font-medium hover:bg-white/90 transition-colors"
            >
              Start Tokenizing
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 font-medium hover:bg-white/10 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-12">Why Assetra?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-black/10 rounded-lg">
              <Shield className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
              <p className="text-black/60">
                Every asset is verified through our oracle system and stored
                securely on IPFS with blockchain proof.
              </p>
            </div>
            <div className="p-6 border border-black/10 rounded-lg">
              <Coins className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fractional Ownership</h3>
              <p className="text-black/60">
                Invest in high-value assets with fractional shares. Trade and
                earn revenue from tokenized real-world assets.
              </p>
            </div>
            <div className="p-6 border border-black/10 rounded-lg">
              <TrendingUp className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Built on Base</h3>
              <p className="text-black/60">
                Lightning-fast transactions with low fees on Base, powered by
                Ethereum's security and scale.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-black/5 py-20">
        <Container className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-black/60 mb-8 max-w-xl mx-auto">
            Connect your wallet and start tokenizing your real-world assets today.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black text-white px-8 py-3 font-medium hover:bg-black/90 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Container>
      </section>
    </div>
  );
}
