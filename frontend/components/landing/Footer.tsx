export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white/70 py-14">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold text-lg text-white mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            NovaGen
          </div>
          <p className="text-sm max-w-xs leading-relaxed">AI drug discovery, from target identification to clinical recommendation.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
          <div>
            <p className="text-white font-medium mb-3">Platform</p>
            <ul className="space-y-2">
              <li><a href="#platform" className="hover:text-white">Architecture</a></li>
              <li><a href="#workflow" className="hover:text-white">Workflow</a></li>
              <li><a href="#ai-engine" className="hover:text-white">AI Engine</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium mb-3">Company</p>
            <ul className="space-y-2">
              <li><a href="#contact" className="hover:text-white">About</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium mb-3">Legal</p>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#security" className="hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/10 text-xs">
        © {new Date().getFullYear()} NovaGen AI. All rights reserved.
      </div>
    </footer>
  );
}
