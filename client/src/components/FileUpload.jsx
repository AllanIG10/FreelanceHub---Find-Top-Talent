import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, Image, File, AlertCircle, CheckCircle } from 'lucide-react'

const ALLOWED_TYPES = {
  'application/pdf': { icon: FileText, color: 'text-red-500', label: 'PDF' },
  'application/msword': { icon: FileText, color: 'text-blue-500', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-blue-500', label: 'DOCX' },
  'image/jpeg': { icon: Image, color: 'text-green-500', label: 'JPG' },
  'image/png': { icon: Image, color: 'text-green-500', label: 'PNG' },
  'image/gif': { icon: Image, color: 'text-purple-500', label: 'GIF' },
  'image/webp': { icon: Image, color: 'text-purple-500', label: 'WEBP' },
}

const MAX_SIZE_MB = 10
const MAX_FILES = 5

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileUpload({ onFilesChange, maxFiles = MAX_FILES, accept = Object.keys(ALLOWED_TYPES) }) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState([])
  const [uploading, setUploading] = useState({})
  const inputRef = useRef(null)

  const validateFile = (file) => {
    if (!ALLOWED_TYPES[file.type]) {
      return `${file.name}: File type not supported`
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `${file.name}: File too large (max ${MAX_SIZE_MB}MB)`
    }
    return null
  }

  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)
    const errs = []
    const valid = []

    fileArray.forEach(file => {
      if (files.length + valid.length >= maxFiles) {
        errs.push(`Maximum ${maxFiles} files allowed`)
        return
      }
      const err = validateFile(file)
      if (err) {
        errs.push(err)
      } else {
        valid.push({
          id: `${file.name}-${Date.now()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending',
        })
      }
    })

    setErrors(errs)
    if (valid.length > 0) {
      const updated = [...files, ...valid]
      setFiles(updated)
      onFilesChange?.(updated.map(f => f.file))

      // Simulate upload progress
      valid.forEach(f => {
        simulateUpload(f.id)
      })
    }
  }, [files, maxFiles, onFilesChange])

  const simulateUpload = (id) => {
    setUploading(prev => ({ ...prev, [id]: 0 }))
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploading(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done', progress: 100 } : f))
      } else {
        setUploading(prev => ({ ...prev, [id]: Math.round(progress) }))
      }
    }, 200)
  }

  const removeFile = (id) => {
    const updated = files.filter(f => f.id !== id)
    setFiles(updated)
    onFilesChange?.(updated.map(f => f.file))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <motion.div
        animate={{ borderColor: dragOver ? '#14a800' : '#e5e7eb', backgroundColor: dragOver ? 'rgba(20,168,0,0.04)' : 'transparent' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept.join(',')}
          onChange={(e) => addFiles(e.target.files)}
        />

        <motion.div
          animate={{ scale: dragOver ? 1.1 : 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            dragOver ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <Upload className={`w-7 h-7 ${dragOver ? 'text-brand-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PDF, DOC, DOCX, JPG, PNG up to {MAX_SIZE_MB}MB each (max {maxFiles} files)
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {err}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.map((f) => {
          const config = ALLOWED_TYPES[f.type] || { icon: File, color: 'text-gray-500', label: 'FILE' }
          const FileIcon = config.icon
          const progress = uploading[f.id]
          const isDone = f.status === 'done'

          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <FileIcon className={`w-5 h-5 ${config.color}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{formatSize(f.size)}</span>
                  {progress !== undefined ? (
                    <>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-500 rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <span className="text-xs text-brand-500">{progress}%</span>
                    </>
                  ) : isDone ? (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <CheckCircle className="w-3 h-3" /> Uploaded
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFile(f.id)}
                className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload
