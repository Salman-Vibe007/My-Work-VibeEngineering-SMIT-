import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-[#FFFDD0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-7 h-7 text-[#4682B4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-lg font-bold tracking-wider">CHRONOS</span>
            </div>
            <p className="text-sm text-[#FFFDD0]/60 leading-relaxed">
              Premium timepieces for the discerning collector.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#2E8B57]">Shop</h3>
            <ul className="space-y-2 text-sm text-[#FFFDD0]/60">
              <li><Link href="/products" className="hover:text-[#FFFDD0] transition-colors">All Watches</Link></li>
              <li><Link href="/products?style=sport" className="hover:text-[#FFFDD0] transition-colors">Sport</Link></li>
              <li><Link href="/products?style=dress" className="hover:text-[#FFFDD0] transition-colors">Dress</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#2E8B57]">Support</h3>
            <ul className="space-y-2 text-sm text-[#FFFDD0]/60">
              <li><span className="hover:text-[#FFFDD0] transition-colors cursor-pointer">Shipping Info</span></li>
              <li><span className="hover:text-[#FFFDD0] transition-colors cursor-pointer">Returns</span></li>
              <li><span className="hover:text-[#FFFDD0] transition-colors cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#2E8B57]">Trust</h3>
            <ul className="space-y-2 text-sm text-[#FFFDD0]/60">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4682B4]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secure Checkout
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4682B4]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Authentic Products
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#FFFDD0]/10 mt-8 pt-8 text-center text-xs text-[#FFFDD0]/40">
          &copy; {new Date().getFullYear()} Chronos Watch Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
