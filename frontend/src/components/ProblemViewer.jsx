import { useState } from 'react';
import { ZoomIn, X } from 'lucide-react';

export default function ProblemViewer({ problem }) {
    const [imageZoomed, setImageZoomed] = useState(false);

    if (!problem) {
        return (
            <div className="h-full flex items-center justify-center bg-white p-8">
                <div className="text-center text-gray-500">
                    <p className="font-medium">No problem loaded</p>
                    <p className="text-sm mt-1">Please select a level to begin</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-white">
            <div className="p-8 max-w-3xl mx-auto">
                {/* Minimal header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide rounded">
                            {problem.level || '3A'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide rounded">
                            {problem.problemType || 'UI'}
                        </span>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900">
                        {problem.title}
                    </h1>
                </div>

                {/* Problem statement */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Description
                    </h3>
                    <div className="prose prose-sm max-w-none">
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {problem.description}
                        </div>
                    </div>
                </div>

                {/* Sample image */}
                {problem.sampleImage && (
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                            Expected Output
                        </h3>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="relative group">
                                <img
                                    src={problem.sampleImage}
                                    alt="Expected output"
                                    className="w-full h-auto rounded cursor-pointer transition-opacity hover:opacity-90"
                                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                                    onClick={() => setImageZoomed(true)}
                                />
                                <button
                                    onClick={() => setImageZoomed(true)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="View full size"
                                >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                Click to view full size
                            </p>
                        </div>
                    </div>
                )}

                {/* Assessment note */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Manual Review:</span> Your submission will be reviewed by evaluators. Focus on matching the requirements and expected output.
                    </p>
                </div>
            </div>

            {/* Image zoom modal */}
            {imageZoomed && problem.sampleImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
                    onClick={() => setImageZoomed(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        onClick={() => setImageZoomed(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={problem.sampleImage}
                        alt="Expected output - full size"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
