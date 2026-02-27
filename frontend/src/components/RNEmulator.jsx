import { useState } from "react";
import { Layout, Smartphone, Tablet, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export default function RNEmulator({ embedUrl, loading, error, output, html, initialScale = 0.7, darkMode = false }) {
    const [device, setDevice] = useState("android"); // 'ios' or 'android'
    const [orientation, setOrientation] = useState("portrait"); // 'portrait' or 'landscape'
    const [scale, setScale] = useState(initialScale); // Default scale

    const deviceFrames = {
        ios: {
            portrait: {
                width: "375px",
                height: "812px",
                bgColor: "#000",
                borderRadius: "40px",
                padding: "12px",
            },
            landscape: {
                width: "812px",
                height: "375px",
                bgColor: "#000",
                borderRadius: "40px",
                padding: "12px",
            },
        },
        android: {
            portrait: {
                width: "360px",
                height: "740px",
                bgColor: "#1a1a1a",
                borderRadius: "20px",
                padding: "8px",
            },
            landscape: {
                width: "740px",
                height: "360px",
                bgColor: "#1a1a1a",
                borderRadius: "20px",
                padding: "8px",
            },
        },
    };

    const currentFrame = deviceFrames[device][orientation];

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'} rounded-lg shadow-sm border overflow-hidden`}>
            {/* Emulator Header */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Live Preview</span>
                    {(embedUrl || html) && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Control */}
                    <div className={`flex items-center gap-1 rounded-md p-0.5 mr-2 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        <button
                            onClick={() => setScale(Math.max(0.4, scale - 0.1))}
                            className={`p-1 rounded focus:outline-none transition-colors ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-white'}`}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-xs font-mono w-9 text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(Math.min(1.2, scale + 0.1))}
                            className={`p-1 rounded focus:outline-none transition-colors ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-white'}`}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Device Selector */}
                    <div className={`flex rounded-md p-0.5 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        <button
                            onClick={() => setDevice("ios")}
                            className={`px-2 py-1 text-xs rounded transition flex items-center gap-1 ${device === "ios"
                                ? (darkMode ? "bg-slate-800 text-slate-200 shadow-sm" : "bg-white text-slate-900 shadow-sm font-medium")
                                : (darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")
                                }`}
                        >
                            <Smartphone className="w-3 h-3" />
                            iOS
                        </button>
                        <button
                            onClick={() => setDevice("android")}
                            className={`px-2 py-1 text-xs rounded transition flex items-center gap-1 ${device === "android"
                                ? (darkMode ? "bg-slate-800 text-slate-200 shadow-sm" : "bg-white text-slate-900 shadow-sm font-medium")
                                : (darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")
                                }`}
                        >
                            <Tablet className="w-3 h-3" />
                            Android
                        </button>
                    </div>

                    {/* Orientation Toggle */}
                    <button
                        onClick={() =>
                            setOrientation(orientation === "portrait" ? "landscape" : "portrait")
                        }
                        className={`p-1.5 rounded transition ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        title="Toggle orientation"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Emulator Display Area */}
            <div className={`flex-1 flex items-center justify-center p-2 overflow-auto ${darkMode ? 'bg-slate-950/50' : 'bg-transparent'}`}>
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <div className={`absolute inset-0 flex items-center justify-center`}>
                                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Compiling your app...</p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Building Docker container</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col gap-4">
                        {error && (
                            <div className={`p-4 border rounded-lg shrink-0 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start gap-3">
                                    <svg className={`w-5 h-5 shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h3 className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-900'}`}>Execution Error</h3>
                                        <p className={`text-sm mt-1 font-mono text-xs ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {output ? (
                            <div className={`flex-1 rounded-lg p-4 overflow-auto shadow-inner border font-mono text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'}`}>
                                <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
                                    <span className="font-bold">TERMINAL OUTPUT</span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">READ_ONLY</span>
                                </div>
                                <pre className="text-slate-300 whitespace-pre-wrap font-ligatures-none">
                                    {output}
                                </pre>
                            </div>
                        ) : embedUrl || html ? (
                            /* Device Frame Logic */
                            <div className="flex-1 flex items-center justify-center relative min-h-0">
                                <div
                                    className="relative shadow-2xl transition-all duration-300"
                                    style={{
                                        width: currentFrame.width,
                                        height: currentFrame.height,
                                        backgroundColor: currentFrame.bgColor,
                                        borderRadius: currentFrame.borderRadius,
                                        padding: currentFrame.padding,
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'center center'
                                    }}
                                >
                                    {/* Notch for iOS */}
                                    {device === "ios" && orientation === "portrait" && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"></div>
                                    )}

                                    {/* Screen */}
                                    <div className="relative w-full h-full bg-white rounded-[32px] overflow-hidden">
                                        {embedUrl ? (
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full border-0 bg-white"
                                                title="React Native Preview"
                                                sandbox="allow-scripts allow-same-origin allow-forms"
                                            />
                                        ) : (
                                            <iframe
                                                srcDoc={html}
                                                className="w-full h-full border-0 bg-white"
                                                title="HTML Preview"
                                                sandbox="allow-scripts allow-same-origin allow-forms"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-4">
                                {error ? null : (
                                    <div className="text-center max-w-sm">
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                            <Layout className="w-8 h-8" />
                                        </div>
                                        <h3 className={`text-base font-medium mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Ready to Compile</h3>
                                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Click Run to build your React Native app and view it here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
