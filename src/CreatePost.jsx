import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function CreatePost({ onSuccess }) {
    const { getToken } = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('')
    const [thumbnail, setThumbnail] = useState(null)
    const [video, setVideo] = useState(null)
    const [location, setLocation] = useState('')
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduledAt, setScheduledAt] = useState('')
    const [errors, setErrors] = useState({})
    const [msg, setMsg] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState(null)

    function handleThumbnailChange(e) {
        if (e.target.files && e.target.files[0]) {
            setThumbnail(e.target.files[0])
            if (errors.thumbnail) {
                setErrors({ ...errors, thumbnail: null })
            }
        }
    }

    function handleVideoChange(e) {
        if (e.target.files && e.target.files[0]) {
            setVideo(e.target.files[0])
            if (errors.video) {
                setErrors({ ...errors, video: null })
            }
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    function getCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported.')
            return
        }
        setLocationLoading(true)
        setLocationError(null)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                setLatitude(lat.toString())
                setLongitude(lon.toString())
                setLocationLoading(false)
                if (errors.latitude) {
                    setErrors({ ...errors, latitude: null })
                }
                if (errors.longitude) {
                    setErrors({ ...errors, longitude: null })
                }
            },
            (err) => {
                setLocationLoading(false)
                if (err.code === 1) {
                    setLocationError('Location access denied.')
                } else if (err.code === 2) {
                    setLocationError('Location unavailable.')
                } else if (err.code === 3) {
                    setLocationError('Location request timeout.')
                } else {
                    setLocationError('Error getting location.')
                }
            },
            { timeout: 10000, maximumAge: 300000 }
        )
    }

    function validate() {
        const newErrors = {}

        if (!title || title.trim().length === 0) {
            newErrors.title = 'Title is required.'
        }

        if (!description || description.trim().length === 0) {
            newErrors.description = 'Description is required.'
        }

        if (!tags || tags.trim().length === 0) {
            newErrors.tags = 'Tags are required.'
        }

        if (!thumbnail) {
            newErrors.thumbnail = 'Thumbnail is required.'
        } else if (!thumbnail.type.startsWith('image/')) {
            newErrors.thumbnail = 'Thumbnail must be an image file.'
        } else {
            const maxThumbnailSize = 10 * 1024 * 1024
            if (thumbnail.size > maxThumbnailSize) {
                newErrors.thumbnail = 'Thumbnail size must not exceed 10MB.'
            }
        }

        if (!video) {
            newErrors.video = 'Video is required.'
        } else {
            if (video.type !== 'video/mp4') {
                newErrors.video = 'Video must be in MP4 format.'
            }
            const maxSize = 200 * 1024 * 1024
            if (video.size > maxSize) {
                newErrors.video = 'Video size must not exceed 200MB.'
            }
        }

        if (latitude && latitude.trim()) {
            const lat = parseFloat(latitude)
            if (isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.latitude = 'Latitude must be between -90 and 90.'
            }
        }

        if (longitude && longitude.trim()) {
            const lon = parseFloat(longitude)
            if (isNaN(lon) || lon < -180 || lon > 180) {
                newErrors.longitude = 'Longitude must be between -180 and 180.'
            }
        }

        if (isScheduled) {
            if (!scheduledAt || scheduledAt.trim().length === 0) {
                newErrors.scheduledAt = 'Scheduled date and time is required when scheduling is enabled.'
            } else {
                const selectedDate = new Date(scheduledAt)
                const now = new Date()
                if (selectedDate <= now) {
                    newErrors.scheduledAt = 'Scheduled date and time must be in the future.'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setMsg(null)

        if (!validate()) {
            setMsg('Please fix errors in the form.')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('description', description.trim())
        formData.append('tags', tags.trim())
        formData.append('thumbnail', thumbnail)
        formData.append('video', video)
        if (location && location.trim()) {
            formData.append('location', location.trim())
        }
        if (latitude && latitude.trim()) {
            formData.append('latitude', latitude.trim())
        }
        if (longitude && longitude.trim()) {
            formData.append('longitude', longitude.trim())
        }
        if (isScheduled && scheduledAt && scheduledAt.trim()) {
            const selectedDate = new Date(scheduledAt)
            const isoString = selectedDate.toISOString()
            formData.append('scheduledAt', isoString)
        }

        const xhr = new XMLHttpRequest()
        const token = getToken()
        const UPLOAD_TIMEOUT = 5 * 60 * 1000

        let timeoutId = setTimeout(() => {
            xhr.abort()
            setIsUploading(false)
            setUploadProgress(0)
            setMsg('Upload timeout. The upload took too long. Please try again with a smaller file or check your connection.')
        }, UPLOAD_TIMEOUT)

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                setUploadProgress(percentComplete)
            }
        })

        xhr.addEventListener('load', () => {
            clearTimeout(timeoutId)
            setIsUploading(false)
            if (xhr.status >= 200 && xhr.status < 300) {
                setMsg('Post created successfully!')
                setTitle('')
                setDescription('')
                setTags('')
                setThumbnail(null)
                setVideo(null)
                setLocation('')
                setLatitude('')
                setLongitude('')
                setIsScheduled(false)
                setScheduledAt('')
                setUploadProgress(0)
                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess()
                    }, 1500)
                }
            } else {
                let errorMessage = 'Error creating post.'
                try {
                    const errorData = JSON.parse(xhr.responseText)
                    errorMessage = errorData.message || errorMessage
                } catch {
                    if (xhr.status === 400) {
                        errorMessage = 'Invalid data. Please check your input.'
                    } else if (xhr.status === 401) {
                        errorMessage = 'You must be logged in to create a post.'
                    } else if (xhr.status === 403) {
                        errorMessage = 'You do not have permission to create a post.'
                    } else if (xhr.status === 413) {
                        errorMessage = 'File size too large. Please use a smaller file.'
                    } else if (xhr.status === 415) {
                        errorMessage = 'Unsupported file format. Please use MP4 for video and an image for thumbnail.'
                    } else if (xhr.status >= 500) {
                        errorMessage = 'Server error. Please try again later.'
                    }
                }
                setMsg(errorMessage)
            }
        })

        xhr.addEventListener('error', () => {
            clearTimeout(timeoutId)
            setIsUploading(false)
            setUploadProgress(0)
            setMsg('Network error. Please check your connection and try again.')
        })

        xhr.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            setIsUploading(false)
            setUploadProgress(0)
            if (xhr.status === 0) {
                setMsg('Upload cancelled or connection lost.')
            }
        })

        xhr.addEventListener('timeout', () => {
            clearTimeout(timeoutId)
            setIsUploading(false)
            setUploadProgress(0)
            setMsg('Upload timeout. The upload took too long. Please try again.')
        })

        xhr.open('POST', '/api/posts')
        xhr.timeout = UPLOAD_TIMEOUT
        
        if (token && token !== 'cookie-auth') {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        xhr.send(formData)
    }

    return (
        <form className="create-post" onSubmit={handleSubmit}>
            <h2>Create Post</h2>

            <input
                type="text"
                placeholder="Title"
                required
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value)
                    if (errors.title) {
                        setErrors({ ...errors, title: null })
                    }
                }}
            />
            {errors.title && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.title}</p>}

            <textarea
                placeholder="Description"
                required
                value={description}
                onChange={(e) => {
                    setDescription(e.target.value)
                    if (errors.description) {
                        setErrors({ ...errors, description: null })
                    }
                }}
                rows="5"
            />
            {errors.description && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.description}</p>}

            <input
                type="text"
                placeholder="Tags (comma separated)"
                required
                value={tags}
                onChange={(e) => {
                    setTags(e.target.value)
                    if (errors.tags) {
                        setErrors({ ...errors, tags: null })
                    }
                }}
            />
            {errors.tags && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.tags}</p>}

            <div>
                <label>Thumbnail:</label>
                <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleThumbnailChange}
                />
                {thumbnail && (
                    <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#aaa' }}>
                        Selected: {thumbnail.name} ({formatFileSize(thumbnail.size)})
                    </div>
                )}
                {errors.thumbnail && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.thumbnail}</p>}
            </div>

            <div>
                <label>Video:</label>
                <input
                    type="file"
                    accept="video/mp4"
                    required
                    onChange={handleVideoChange}
                />
                {video && (
                    <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#aaa' }}>
                        Selected: {video.name} ({formatFileSize(video.size)})
                    </div>
                )}
                {errors.video && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.video}</p>}
            </div>

            <input
                type="text"
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                    type="checkbox"
                    id="isScheduled"
                    checked={isScheduled}
                    onChange={(e) => {
                        setIsScheduled(e.target.checked)
                        if (!e.target.checked) {
                            setScheduledAt('')
                            if (errors.scheduledAt) {
                                setErrors({ ...errors, scheduledAt: null })
                            }
                        }
                    }}
                />
                <label htmlFor="isScheduled" style={{ cursor: 'pointer' }}>Zakazano objavljivanje</label>
            </div>

            {isScheduled && (
                <div>
                    <label>Scheduled Date and Time:</label>
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => {
                            setScheduledAt(e.target.value)
                            if (errors.scheduledAt) {
                                setErrors({ ...errors, scheduledAt: null })
                            }
                        }}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                    {errors.scheduledAt && <p style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>{errors.scheduledAt}</p>}
                </div>
            )}

            <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="number"
                        step="any"
                        placeholder="Latitude (optional)"
                        value={latitude}
                        onChange={(e) => {
                            setLatitude(e.target.value)
                            if (errors.latitude) {
                                setErrors({ ...errors, latitude: null })
                            }
                        }}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="Longitude (optional)"
                        value={longitude}
                        onChange={(e) => {
                            setLongitude(e.target.value)
                            if (errors.longitude) {
                                setErrors({ ...errors, longitude: null })
                            }
                        }}
                        style={{ flex: 1 }}
                    />
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        style={{ padding: '8px 12px', cursor: locationLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {locationLoading ? 'Getting...' : '📍 Get Location'}
                    </button>
                </div>
                {locationError && <p style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>{locationError}</p>}
                {errors.latitude && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.latitude}</p>}
                {errors.longitude && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.longitude}</p>}
            </div>

            {msg && <p>{msg}</p>}
            
            {isUploading && (
                <div className="upload-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar" 
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '5px' }}>
                        Uploading... {uploadProgress}%
                    </p>
                </div>
            )}

            <button type="submit" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Create Post'}
            </button>
        </form>
    )
}

