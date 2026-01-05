'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { FiUpload, FiX, FiImage, FiAlertCircle } from 'react-icons/fi'
import axios from 'axios'
import { getAuthHeaders } from './Toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface ImageUploadProps {
    images: string[]
    onChange: (urls: string[]) => void
    maxImages?: number
    label?: string
}

interface PreviewImage {
    id: string
    url: string
    file?: File
    isUploading?: boolean
    isExisting?: boolean
}

export default function ImageUpload({
    images,
    onChange,
    maxImages = 5,
    label = "Images du produit"
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<PreviewImage[]>(() =>
        images.map((url, idx) => ({
            id: `existing-${idx}`,
            url,
            isExisting: true
        }))
    )
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const validateFile = (file: File): string | null => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!allowedTypes.includes(file.type)) {
            return `${file.name}: Format non supporté. Utilisez JPG, PNG, GIF ou WebP.`
        }
        if (file.size > maxSize) {
            return `${file.name}: Taille maximale dépassée (5MB max).`
        }
        return null
    }

    const uploadFiles = async (files: File[]) => {
        setError(null)
        setIsUploading(true)

        // Validation
        const currentCount = previews.length
        if (currentCount + files.length > maxImages) {
            setError(`Maximum ${maxImages} images autorisées. Vous en avez déjà ${currentCount}.`)
            setIsUploading(false)
            return
        }

        // Valider chaque fichier
        for (const file of files) {
            const validationError = validateFile(file)
            if (validationError) {
                setError(validationError)
                setIsUploading(false)
                return
            }
        }

        // Créer les previews temporaires
        const tempPreviews: PreviewImage[] = files.map((file, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            url: URL.createObjectURL(file),
            file,
            isUploading: true
        }))

        setPreviews(prev => [...prev, ...tempPreviews])

        // Upload vers le serveur
        try {
            const formData = new FormData()
            files.forEach(file => {
                formData.append('files', file)
            })

            const { data } = await axios.post(`${API_URL}/uploads/images`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (data.success && data.urls) {
                // Remplacer les previews temporaires par les URLs réelles
                setPreviews(prev => {
                    const newPreviews = prev.filter(p => !p.isUploading)
                    const uploadedPreviews = data.urls.map((url: string, idx: number) => ({
                        id: `uploaded-${Date.now()}-${idx}`,
                        url,
                        isExisting: true
                    }))
                    return [...newPreviews, ...uploadedPreviews]
                })

                // Notifier le parent
                const allUrls = [
                    ...previews.filter(p => !p.isUploading).map(p => p.url),
                    ...data.urls
                ]
                onChange(allUrls)
            }
        } catch (err: any) {
            console.error('Erreur upload:', err)
            setError(err.response?.data?.detail || 'Erreur lors de l\'upload des images')
            // Retirer les previews temporaires en cas d'erreur
            setPreviews(prev => prev.filter(p => !p.isUploading))
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
        if (files.length > 0) {
            uploadFiles(files)
        }
    }, [previews.length])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            uploadFiles(files)
        }
        // Reset input pour permettre de re-sélectionner le même fichier
        e.target.value = ''
    }

    const removeImage = (id: string) => {
        setPreviews(prev => {
            const newPreviews = prev.filter(p => p.id !== id)
            // Notifier le parent
            onChange(newPreviews.filter(p => p.isExisting).map(p => p.url))
            return newPreviews
        })
    }

    const setMainImage = (id: string) => {
        setPreviews(prev => {
            const imageToMove = prev.find(p => p.id === id)
            if (!imageToMove) return prev
            const others = prev.filter(p => p.id !== id)
            const newPreviews = [imageToMove, ...others]
            // Notifier le parent
            onChange(newPreviews.filter(p => p.isExisting).map(p => p.url))
            return newPreviews
        })
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label} <span className="text-gray-400">({previews.length}/{maxImages})</span>
            </label>

            {/* Zone de drop */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'
                    }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                    {isUploading ? (
                        <>
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
                            <p className="text-gray-600">Upload en cours...</p>
                        </>
                    ) : (
                        <>
                            <FiUpload className="w-10 h-10 text-gray-400" />
                            <p className="text-gray-600">
                                <span className="text-pink-600 font-medium">Cliquez pour sélectionner</span>
                                {' '}ou glissez-déposez vos images
                            </p>
                            <p className="text-xs text-gray-400">
                                JPG, PNG, GIF ou WebP • Max 5MB par image
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Message d'erreur */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto hover:text-red-800"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Prévisualisation des images */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {previews.map((preview, index) => (
                        <div
                            key={preview.id}
                            className={`
                relative group aspect-square rounded-lg overflow-hidden border-2
                ${index === 0 ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'}
                ${preview.isUploading ? 'opacity-50' : ''}
              `}
                        >
              {/* Image */}
              <Image
                src={
                  preview.url.startsWith('/api') 
                    ? `${API_URL.replace('/api', '')}${preview.url}` 
                    : preview.url.startsWith('blob:')
                    ? preview.url
                    : preview.url // Cloudinary URLs are already complete
                }
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized={preview.url.startsWith('blob:') || preview.url.startsWith('/api')}
              />

                            {/* Badge image principale */}
                            {index === 0 && (
                                <div className="absolute top-1 left-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    Principale
                                </div>
                            )}

                            {/* Indicateur de chargement */}
                            {preview.isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                                </div>
                            )}

                            {/* Actions au survol */}
                            {!preview.isUploading && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {index !== 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setMainImage(preview.id) }}
                                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                            title="Définir comme image principale"
                                        >
                                            <FiImage className="w-4 h-4 text-pink-600" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(preview.id) }}
                                        className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                                        title="Supprimer"
                                    >
                                        <FiX className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Aide */}
            {previews.length > 0 && (
                <p className="text-xs text-gray-500">
                    💡 La première image sera l'image principale du produit. Cliquez sur une image pour la définir comme principale.
                </p>
            )}
        </div>
    )
}

