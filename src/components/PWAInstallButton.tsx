import { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  X,
  WifiOff,
  Store,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export function PWAInstallButton({
  deviceMode,
}: {
  deviceMode: 'laptop' | 'mobile';
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'device' | 'stores'>('device');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (isInstalled) return null;

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setActiveTab('device');
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleClick}
          aria-label="অ্যাপ ইনস্টল"
          className="h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {deviceMode === 'laptop' ? 'অ্যাপ ইনস্টল' : 'ইনস্টল'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('stores');
            setShowGuide(true);
          }}
          title="Play Store ও App Store গাইড"
          aria-label="Play Store ও App Store গাইড"
          className="hidden md:inline-flex h-9 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">স্টোর গাইড</span>
        </button>
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-lg max-h-[88vh] flex flex-col bg-white rounded-3xl border-2 border-emerald-200 shadow-xl overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
                <h3
                  id="pwa-guide-title"
                  className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
                >
                  {activeTab === 'stores' ? (
                    <Store className="w-5 h-5 text-sky-600 shrink-0" />
                  ) : deviceMode === 'laptop' ? (
                    <Monitor className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {activeTab === 'stores'
                      ? 'Google Play ও App Store প্রকাশনা গাইড'
                      : 'সরাসরি ডিভাইসে ইনস্টল করুন'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="বন্ধ করুন"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-5 pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('device')}
                  className={`flex-1 h-10 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    activeTab === 'device'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  সরাসরি ইনস্টল (ফ্রি)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stores')}
                  className={`flex-1 h-10 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    activeTab === 'stores'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Play Store / App Store
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-sm text-slate-700">
                {activeTab === 'device' ? (
                  <>
                    {isIOS ? (
                      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                        <p className="font-bold text-slate-900">iPhone / iPad (Safari):</p>
                        <p>১. নিচের <strong>Share (□↑)</strong> বাটনে ট্যাপ করুন।</p>
                        <p>২. স্ক্রল করে <strong>Add to Home Screen</strong> চাপুন।</p>
                        <p className="text-xs text-sky-800">
                          সম্পূর্ণ অফলাইন ও পূর্ণ-স্ক্রিন অ্যাপ হিসেবে হোম স্ক্রিনে যুক্ত হবে।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                          <p className="font-bold text-amber-900">
                            অ্যান্ড্রয়েড মোবাইলে ইনস্টল (Chrome):
                          </p>
                          <p>
                            Chrome মেনু (<strong>⋮</strong>) থেকে <strong>Add to Home screen / Install app</strong> চাপুন — সাথে সাথে অ্যাপ হিসেবে ইনস্টল হবে।
                          </p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                          <p className="font-bold text-emerald-900">
                            ল্যাপটপ / ডেস্কটপে ইনস্টল (Chrome / Edge):
                          </p>
                          <p>
                            অ্যাড্রেস বারের ডান কোণায় <strong>Install (⊕)</strong> আইকনে ক্লিক করুন অথবা <strong>⋮ Menu → Save and share → Install page as app</strong> বাছাই করুন।
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5">
                      <p className="font-bold text-emerald-900">
                        ✅ স্টোরের জন্য অ্যাপের প্রয়োজনীয় ফাইল প্রস্তুত আছে:
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {[
                          { key: 'manifest', label: 'Web Manifest', path: '/manifest.webmanifest' },
                          { key: 'privacy', label: 'Privacy Policy', path: '/privacy.html' },
                          { key: 'assetlinks', label: 'Android AssetLinks', path: '/.well-known/assetlinks.json' },
                        ].map((item) => {
                          const fullUrl = `${origin}${item.path}`;
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between gap-2 bg-white rounded-xl px-2.5 py-1.5 border border-emerald-100"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-xs">{item.label}</div>
                                <div className="text-[11px] text-slate-500 truncate">{fullUrl}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleCopy(item.key, fullUrl)}
                                className="h-8 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs inline-flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                {copiedKey === item.key ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>কপি</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>কপি</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-1.5">
                      <p className="font-bold text-sky-950">
                        🤖 Google Play Store-এ আপলোড (TWA / PWABuilder):
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                        <li>প্রথমে অ্যাপটি আপনার পাবলিক HTTPS ডোমেইনে ডিপ্লয় করুন।</li>
                        <li>
                          <strong>pwabuilder.com</strong> ওয়েবসাইটে লাইভ URL দিন এবং{' '}
                          <strong>Package for Stores → Android</strong> থেকে <code>.aab</code> ফাইল ডাউনলোড করুন (অথবা <code>npx @bubblewrap/cli init</code> চালান)।
                        </li>
                        <li>
                          Play Console থেকে পাওয়া <strong>SHA-256</strong> কোডটি{' '}
                          <code>public/.well-known/assetlinks.json</code> ফাইলে বসিয়ে রি-ডিপ্লয় করুন।
                        </li>
                        <li>
                          Play Console-এ <strong>Privacy Policy URL</strong> হিসেবে{' '}
                          <code>/privacy.html</code> লিংক দিয়ে ফ্রি পাবলিশ করুন!
                        </li>
                      </ol>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 space-y-1.5">
                      <p className="font-bold text-indigo-950">
                        🍎 Apple App Store-এ আপলোড (iOS):
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                        <li>
                          <strong>pwabuilder.com → iOS</strong> অথবা{' '}
                          <strong>Capacitor (<code>npx cap add ios</code>)</strong> দিয়ে Xcode প্রজেক্ট তৈরি করুন।
                        </li>
                        <li>
                          Mac-এ Xcode দিয়ে আর্কাইভ করে <strong>App Store Connect</strong>-এ সাবমিট করুন।
                        </li>
                      </ol>
                    </div>

                    <a
                      href="/privacy.html"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
                    >
                      <span>Privacy Policy পেজ দেখুন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                >
                  বুঝেছি
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-3 z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white shadow-md">
      <WifiOff className="w-4 h-4" />
      <span>অফলাইন মোড — ক্যাশ করা ডেটা দিয়ে চলছে</span>
    </div>
  );
}
