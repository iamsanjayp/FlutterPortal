import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUpload({ value, onChange, label = "Sample Image" }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const processFile = (file) => {
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, JPEG)');
            return;
        }

        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Image size should be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // Get base64 string without prefix for stricter backends if needed, 
            // but usually data URI is fine. We'll strip prefix in parent if needed.
            // Here we keep data URI for preview.
            onChange(reader.result);
            setError(null);
        };
        reader.onerror = () => {
            setError('Failed to read file');
        };
        reader.readAsDataURL(file);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = (e) => {
        processFile(e.target.files[0]);
    };

    const removeImage = (e) => {
        e.stopPropagation(); // Prevent triggering file input
        onChange(null);
        setError(null);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={!!value} // Disable input if value exists so click on remove doesn't trigger
                />

                {value ? (
                    <div className="relative group">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded shadow-sm object-contain"
                        />
                        <button
                            onClick={removeImage}
                            type="button"
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 focus:outline-none"
                            title="Remove image"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-50 mb-3">
                            <ImageIcon size={24} />
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                                Upload a file
                            </span>
                            {' '}or drag and drop
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 2MB
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
