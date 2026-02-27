import React, { useState, useEffect, useMemo, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { FileCode, Plus, Trash2, FolderOpen, Folder, ChevronRight, ChevronDown, FileText, Edit2, PanelLeftClose } from 'lucide-react';

// Helper to build tree from flat paths
const buildFileTree = (files) => {
    const root = {};

    Object.keys(files).forEach(path => {
        const parts = path.split('/');
        let current = root;

        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = index === parts.length - 1 ? { type: 'file', path } : { type: 'folder', children: {} };
            }
            current = current[part].children || current[part];
        });
    });

    return root;
};

// Recursive File Tree Component
const FileTreeItem = ({ name, item, depth = 0, onSelect, onDelete, onRename, activeFile, expandedFolders, toggleFolder, onCreateFile, onCreateFolder, readOnly, renamingPath, setRenamingPath }) => {
    const isFolder = item.type === 'folder';
    const paddingLeft = `${depth * 12 + 12}px`;
    const isExpanded = expandedFolders.includes(name);
    const isRenaming = renamingPath === name;

    const [tempName, setTempName] = useState(name.split('/').pop());
    const inputRef = useRef(null);

    useEffect(() => {
        if (isRenaming) {
            setTempName(name.split('/').pop());
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isRenaming, name]);

    const handleRenameSubmit = (e) => {
        e?.preventDefault();
        onRename(name, tempName);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') setRenamingPath(null);
    };

    if (isFolder) {
        return (
            <div>
                <div
                    className="flex items-center justify-between py-1 px-2 hover:bg-slate-800 cursor-pointer group text-slate-400 select-none"
                    style={{ paddingLeft }}
                    onClick={() => !isRenaming && toggleFolder(name)}
                >
                    <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />

                        {isRenaming ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900 border border-blue-500 text-xs text-white px-1 py-0.5 w-full outline-none rounded"
                            />
                        ) : (
                            <span className="text-sm truncate">{name.split('/').pop()}</span>
                        )}
                    </div>
                    {!readOnly && !isRenaming && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingPath(name);
                                }}
                                className="p-0.5 hover:text-blue-400"
                                title="Rename"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateFile(name);
                                }}
                                className="p-0.5 hover:text-blue-400"
                                title="New File"
                            >
                                <FileText className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateFolder(name);
                                }}
                                className="p-0.5 hover:text-blue-400"
                                title="New Folder"
                            >
                                <Folder className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(name);
                                }}
                                className="p-0.5 hover:text-red-400"
                                title="Delete"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                {isExpanded && (
                    <div>
                        {Object.entries(item.children)
                            .filter(([k]) => k !== '.keep')
                            .sort(([aName, aItem], [bName, bItem]) => {
                                // Folders first, then files
                                const aIsFolder = aItem.type === 'folder';
                                const bIsFolder = bItem.type === 'folder';
                                if (aIsFolder && !bIsFolder) return -1;
                                if (!aIsFolder && bIsFolder) return 1;
                                return aName.localeCompare(bName);
                            })
                            .map(([childName, childItem]) => (
                                <FileTreeItem
                                    key={`${name}/${childName}`}
                                    name={`${name}/${childName}`}
                                    item={childItem}
                                    depth={depth + 1}
                                    onSelect={onSelect}
                                    onDelete={onDelete}
                                    onRename={onRename}
                                    activeFile={activeFile}
                                    expandedFolders={expandedFolders}
                                    toggleFolder={toggleFolder}
                                    onCreateFile={onCreateFile}
                                    onCreateFolder={onCreateFolder}
                                    readOnly={readOnly}
                                    renamingPath={renamingPath}
                                    setRenamingPath={setRenamingPath}
                                />
                            ))}
                    </div>
                )}
            </div>
        );
    }

    // File Item
    if (name.endsWith('.keep')) return null;

    return (
        <div
            className={`flex items-center justify-between py-1 px-2 cursor-pointer group select-none ${activeFile === name ? 'bg-blue-900/30 text-blue-300 border-l-2 border-blue-500' : 'hover:bg-slate-800 text-slate-400 border-l-2 border-transparent'
                }`}
            style={{ paddingLeft }}
            onClick={() => !isRenaming && onSelect(name)}
        >
            <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-blue-500 text-xs text-white px-1 py-0.5 w-full outline-none rounded"
                    />
                ) : (
                    <span className="text-sm truncate">{name.split('/').pop()}</span>
                )}
            </div>
            {!readOnly && !isRenaming && item.path !== 'App.js' && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setRenamingPath(name);
                        }}
                        className="p-0.5 hover:text-blue-400 text-slate-600"
                        title="Rename"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(name);
                        }}
                        className="p-0.5 hover:text-red-400 text-slate-600"
                        title="Delete"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default function MultiFileEditor({ files, onChange, readOnly = false, initialSidebarOpen = true }) {
    const [activeFile, setActiveFile] = useState('App.js');
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [renamingPath, setRenamingPath] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
    const [openFiles, setOpenFiles] = useState(['App.js']);

    // Creation State
    const [isCreating, setIsCreating] = useState(false); // 'file' | 'folder' | false
    const [parentPath, setParentPath] = useState(''); // '' for root
    const [newName, setNewName] = useState('');


    // Ensure App.js exists
    useEffect(() => {
        if (!files['App.js']) {
            onChange({ ...files, 'App.js': '// Entry point\nimport React from "react";\nimport { View, Text } from "react-native";\n\nexport default function App() {\n  return (\n    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>\n      <Text>Hello World</Text>\n    </View>\n  );\n}' });
        }
    }, [files]);

    const fileTree = useMemo(() => buildFileTree(files), [files]);

    const toggleFolder = (path) => {
        setExpandedFolders(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const handleSelectFile = (path) => {
        if (!openFiles.includes(path)) {
            setOpenFiles([...openFiles, path]);
        }
        setActiveFile(path);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        let finalPath = parentPath ? `${parentPath}/${newName.trim()}` : newName.trim();

        if (isCreating === 'file') {
            if (!finalPath.endsWith('.js') && !finalPath.endsWith('.jsx')) {
                finalPath += '.js';
            }
            if (files[finalPath]) return alert('File already exists');
            onChange({ ...files, [finalPath]: '// New Component' });
            handleSelectFile(finalPath);
        } else if (isCreating === 'folder') {
            const keepPath = `${finalPath}/.keep`;
            if (files[keepPath]) return alert('Folder already exists');

            onChange({ ...files, [keepPath]: '' });
            if (!expandedFolders.includes(finalPath)) {
                setExpandedFolders(prev => [...prev, finalPath]);
            }
        }

        setIsCreating(false);
        setNewName('');
        setParentPath('');
    };

    const handleRename = (oldPath, newName) => {
        if (!newName.trim() || newName === oldPath.split('/').pop()) {
            setRenamingPath(null);
            return;
        }

        const pathParts = oldPath.split('/');
        pathParts.pop();
        const baseDir = pathParts.join('/');
        const newPath = baseDir ? `${baseDir}/${newName.trim()}` : newName.trim();

        // Check if destination exists
        // Note: For folders, we need to check if any file starts with this path
        // For files, we strictly check existence
        if (files[newPath]) {
            alert('File already exists');
            return;
        }

        const newFiles = { ...files };
        const moves = {};
        const deletions = [];

        // Identify all files that need to be moved
        Object.keys(files).forEach(path => {
            if (path === oldPath) {
                // Exact match (file)
                moves[newPath] = files[path];
                deletions.push(path);
            } else if (path.startsWith(oldPath + '/')) {
                // Child match (folder content)
                const suffix = path.substring(oldPath.length);
                moves[newPath + suffix] = files[path];
                deletions.push(path);
            }
        });

        if (Object.keys(moves).length === 0) {
            // Nothing moved? (Shouldn't happen if path exists)
            setRenamingPath(null);
            return;
        }

        // Apply changes
        deletions.forEach(d => delete newFiles[d]);
        Object.assign(newFiles, moves);

        onChange(newFiles);
        setRenamingPath(null);

        // Update state references
        // 1. Open Files
        setOpenFiles(prev => prev.map(p => {
            if (p === oldPath) return newPath;
            if (p.startsWith(oldPath + '/')) return newPath + p.substring(oldPath.length);
            return p;
        }));

        // 2. Active File
        if (activeFile === oldPath) {
            setActiveFile(newPath);
        } else if (activeFile.startsWith(oldPath + '/')) {
            setActiveFile(newPath + activeFile.substring(oldPath.length));
        }

        // 3. Expanded Folders
        setExpandedFolders(prev => prev.map(p => {
            if (p === oldPath) return newPath;
            if (p.startsWith(oldPath + '/')) return newPath + p.substring(oldPath.length);
            return p;
        }));
    };

    const startCreateFile = (parent = '') => {
        setParentPath(parent);
        setIsCreating('file');
        if (parent && !expandedFolders.includes(parent)) setExpandedFolders([...expandedFolders, parent]);
    };

    const startCreateFolder = (parent = '') => {
        setParentPath(parent);
        setIsCreating('folder');
        if (parent && !expandedFolders.includes(parent)) setExpandedFolders([...expandedFolders, parent]);
    };

    const handleDelete = (path) => {
        if (confirm(`Delete ${path}?`)) {
            const newFiles = { ...files };

            // Delete the file/folder and all its children
            Object.keys(newFiles).forEach(p => {
                if (p === path || p.startsWith(path + '/')) {
                    delete newFiles[p];
                }
            });

            onChange(newFiles);
            setOpenFiles(prev => prev.filter(p => p !== path && !p.startsWith(path + '/')));
            if (activeFile === path || activeFile.startsWith(path + '/')) setActiveFile('App.js');
        }
    };

    return (
        <div className="flex h-full bg-[#1e1e1e] border-t border-slate-700">
            {/* Sidebar Toggle (when closed) */}
            {!sidebarOpen && (
                <div className="w-8 border-r border-[#333] bg-[#252526] flex flex-col items-center py-2">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1 hover:bg-[#37373d] rounded text-slate-400 hover:text-white"
                        title="Open Explorer"
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Sidebar */}
            {sidebarOpen && (
                <div className="w-60 flex flex-col border-r border-[#333] bg-[#252526]">
                    <div className="h-9 px-3 flex items-center justify-between text-xs font-bold text-slate-400 bg-[#252526] select-none">
                        <span>EXPLORER</span>
                        <div className="flex items-center gap-1">
                            {!readOnly && (
                                <>
                                    <button
                                        onClick={() => startCreateFile()}
                                        className="p-1 hover:bg-[#37373d] rounded hover:text-white"
                                        title="New File"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => startCreateFolder()}
                                        className="p-1 hover:bg-[#37373d] rounded hover:text-white"
                                        title="New Folder"
                                    >
                                        <Folder className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 hover:bg-[#37373d] rounded hover:text-white"
                                title="Close Explorer"
                            >
                                <PanelLeftClose className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                        {/* Tree Root */}
                        {Object.keys(fileTree).sort((a, b) => {
                            const aIsFolder = fileTree[a].children;
                            const bIsFolder = fileTree[b].children;
                            if (aIsFolder && !bIsFolder) return -1;
                            if (!aIsFolder && bIsFolder) return 1;
                            return a.localeCompare(b);
                        }).map(nodeName => (
                            <FileTreeItem
                                key={nodeName}
                                name={nodeName}
                                item={fileTree[nodeName]}
                                onSelect={handleSelectFile}
                                onDelete={handleDelete}
                                onRename={handleRename}
                                activeFile={activeFile}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                                onCreateFile={startCreateFile}
                                onCreateFolder={startCreateFolder}
                                readOnly={readOnly}
                                renamingPath={renamingPath}
                                setRenamingPath={setRenamingPath}
                            />
                        ))}

                        {/* Creation Input */}
                        {isCreating && (
                            <form onSubmit={handleCreate} className="px-3 py-2 border-t border-slate-700 bg-slate-800">
                                <div className="text-xs text-blue-400 mb-1 font-medium">
                                    New {isCreating === 'file' ? 'File' : 'Folder'} in {parentPath ? parentPath : 'root'}:
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onBlur={() => !newName && setIsCreating(false)}
                                    placeholder={isCreating === 'file' ? "Component.js" : "Folder Name"}
                                    className="w-full px-2 py-1 text-sm bg-slate-900 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Tabs */}
                <div className="h-9 bg-slate-950 border-b border-slate-800 flex items-center overflow-x-auto no-scrollbar">
                    {openFiles.map(file => (
                        <div
                            key={file}
                            onClick={() => setActiveFile(file)}
                            className={`
                                group flex items-center h-full px-3 min-w-[100px] max-w-[200px] border-r border-slate-800 cursor-pointer select-none text-xs transition-colors
                                ${activeFile === file ? 'bg-slate-900 text-blue-400 font-medium border-t-2 border-t-blue-500' : 'bg-slate-950 text-slate-500 hover:bg-slate-900 hover:text-slate-300'}
                            `}
                        >
                            <FileCode className={`w-3 h-3 mr-2 ${activeFile === file ? 'text-blue-400' : 'text-slate-600'}`} />
                            <span className="truncate flex-1">{file.split('/').pop()}</span>
                            {!readOnly && file !== 'App.js' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newOpen = openFiles.filter(f => f !== file);
                                        setOpenFiles(newOpen);
                                        if (activeFile === file) setActiveFile(newOpen[newOpen.length - 1] || 'App.js');
                                    }}
                                    className="ml-1 p-0.5 rounded-full hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Plus className="w-3 h-3 rotate-45 text-slate-500 hover:text-red-400" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex-1 relative">
                    <Editor
                        height="100%"
                        language="javascript"
                        theme="vs-dark"
                        path={activeFile}
                        value={files[activeFile] || ''}
                        onChange={(val) => onChange({ ...files, [activeFile]: val })}
                        options={{
                            readOnly,
                            fontSize: 14,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            tabSize: 2,
                            scrollBeyondLastLine: false,
                            padding: { top: 10 }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
