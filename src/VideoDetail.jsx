import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import { useAuth } from './AuthContext'

export default function VideoDetail({ videoId, onBack }) {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [liking, setLiking] = useState(false)
    const [comments, setComments] = useState([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentsError, setCommentsError] = useState(null)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [likeError, setLikeError] = useState(null)
    const [commentError, setCommentError] = useState(null)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!videoId) {
            setError('Video not selected.')
            setLoading(false)
            return
        }

        async function fetchPost() {
            try {
                setLoading(true)
                setError(null)
                const res = await apiFetch(`/api/posts/${videoId}`)
                
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Video not found.')
                    } else if (res.status === 401) {
                        throw new Error('You must be logged in to view this video.')
                    } else if (res.status === 403) {
                        throw new Error('You do not have permission to view this video.')
                    } else if (res.status >= 500) {
                        throw new Error('Server error. Please try again later.')
                    } else {
                        const errorData = await res.json().catch(() => ({}))
                        throw new Error(errorData.error || 'Error loading video.')
                    }
                }
                
                const data = await res.json()
                setPost(data)
            } catch (err) {
                setError(err.message || 'Error loading video.')
            } finally {
                setLoading(false)
            }
        }

        fetchPost()
    }, [videoId])

    async function fetchComments() {
        if (!post || !post.id) {
            return
        }

        try {
            setLoadingComments(true)
            setCommentsError(null)
            const res = await apiFetch(`/api/posts/${post.id}/comments`)
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Post not found.')
                } else if (res.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error('Error loading comments.')
                }
            }
            
            const data = await res.json()
            setComments(Array.isArray(data) ? data : [])
        } catch (err) {
            setCommentsError(err.message || 'Error loading comments.')
            setComments([])
        } finally {
            setLoadingComments(false)
        }
    }

    useEffect(() => {
        if (!post || !post.id) {
            return
        }

        fetchComments()
    }, [post])

    async function handleLike() {
        if (!isAuthenticated()) {
            setLikeError('You must login to like videos.')
            return
        }

        if (!post || !post.id || liking) {
            return
        }

        try {
            setLiking(true)
            setLikeError(null)
            const res = await apiFetch(`/api/posts/${post.id}/like`, {
                method: 'POST'
            })

            if (!res.ok) {
                if (res.status === 401) {
                    setLikeError('You must login to like videos.')
                    return
                } else if (res.status === 404) {
                    setLikeError('Video not found.')
                    return
                } else if (res.status >= 500) {
                    setLikeError('Server error. Please try again later.')
                    return
                } else {
                    const errorData = await res.json().catch(() => ({}))
                    setLikeError(errorData.error || 'Error liking video.')
                    return
                }
            }

            const data = await res.json()
            const wasLiked = post.isLiked || false
            const newLiked = data.liked || false
            
            let newLikesCount = post.likesCount || 0
            if (wasLiked && !newLiked) {
                newLikesCount = Math.max(0, newLikesCount - 1)
            } else if (!wasLiked && newLiked) {
                newLikesCount = newLikesCount + 1
            }

            setPost({
                ...post,
                isLiked: newLiked,
                likesCount: newLikesCount
            })
        } catch (err) {
            setLikeError(err.message || 'Error liking video.')
        } finally {
            setLiking(false)
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault()

        if (!isAuthenticated()) {
            setCommentError('You must login to comment.')
            return
        }

        if (!post || !post.id || !commentText.trim() || submittingComment) {
            return
        }

        try {
            setSubmittingComment(true)
            setCommentError(null)
            const res = await apiFetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: commentText.trim()
                })
            })

            if (!res.ok) {
                if (res.status === 401) {
                    setCommentError('You must login to comment.')
                    return
                } else if (res.status === 400) {
                    const errorData = await res.json().catch(() => ({}))
                    setCommentError(errorData.error || 'Invalid comment. Please check your input.')
                    return
                } else if (res.status === 404) {
                    setCommentError('Post not found.')
                    return
                } else if (res.status >= 500) {
                    setCommentError('Server error. Please try again later.')
                    return
                } else {
                    const errorData = await res.json().catch(() => ({}))
                    setCommentError(errorData.error || 'Error posting comment.')
                    return
                }
            }

            const newComment = await res.json()
            setCommentText('')
            
            setComments(prevComments => [...prevComments, newComment])
            
            setPost(prevPost => ({
                ...prevPost,
                commentsCount: (prevPost.commentsCount || 0) + 1
            }))
        } catch (err) {
            setCommentError(err.message || 'Error posting comment.')
        } finally {
            setSubmittingComment(false)
        }
    }

    if (loading) {
        return (
            <div className="video-detail">
                {onBack && (
                    <button onClick={onBack} className="back-button">
                        ← Back to feed
                    </button>
                )}
                <p>Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="video-detail">
                {onBack && (
                    <button onClick={onBack} className="back-button">
                        ← Back to feed
                    </button>
                )}
                <p style={{ color: 'red' }}>{error}</p>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="video-detail">
                {onBack && (
                    <button onClick={onBack} className="back-button">
                        ← Back to feed
                    </button>
                )}
                <p>Video not found.</p>
            </div>
        )
    }

    return (
        <div className="video-detail">
            {onBack && (
                <button onClick={onBack} className="back-button">
                    ← Back to feed
                </button>
            )}
            
            {post.id && (
                <div className="video-container">
                    <video 
                        src={`/api/files/videos/${post.id}`}
                        controls
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
            
            <h2>{post.title}</h2>
            
            {post.username && (
                <p className="video-meta">By: {post.username}</p>
            )}

            <div className="video-actions">
                {isAuthenticated() ? (
                    <button 
                        onClick={handleLike}
                        disabled={liking}
                        className={`like-button ${post.isLiked ? 'liked' : ''}`}
                    >
                        {post.isLiked ? '❤️ Liked' : '🤍 Like'}
                    </button>
                ) : (
                    <button 
                        onClick={handleLike}
                        disabled={true}
                        className="like-button"
                        title="You must login to like videos"
                    >
                        🤍 Like
                    </button>
                )}
                <span className="likes-count">
                    {post.likesCount || 0} {post.likesCount === 1 ? 'like' : 'likes'}
                </span>
            </div>
            {likeError && (
                <p className="error-message">
                    {likeError}
                </p>
            )}
            {!isAuthenticated() && !likeError && (
                <p className="info-message">
                    You must login to like videos.
                </p>
            )}
            
            {post.description && (
                <div className="video-info">
                    <p>{post.description}</p>
                </div>
            )}
            
            {post.tags && post.tags.length > 0 && (
                <div className="video-tags">
                    {post.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                    ))}
                </div>
            )}
            
            {post.location && (
                <div className="video-location">
                    <strong>📍 Location:</strong> {post.location}
                </div>
            )}
            
            {post.createdAt && (
                <div className="video-date">
                    Posted: {new Date(post.createdAt).toLocaleString()}
                </div>
            )}

            <div className="comments-section">
                <h3>Comments ({post.commentsCount || 0})</h3>
                
                {isAuthenticated() ? (
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            rows="3"
                            maxLength={1000}
                        />
                        <div>
                            <button
                                type="submit"
                                disabled={submittingComment || !commentText.trim()}
                            >
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                        {commentError && (
                            <p className="error-message">
                                {commentError}
                            </p>
                        )}
                    </form>
                ) : (
                    <p className="info-message">
                        You must login to comment.
                    </p>
                )}

                {loadingComments ? (
                    <p>Loading comments...</p>
                ) : commentsError ? (
                    <p className="error-message">{commentsError}</p>
                ) : comments.length === 0 ? (
                    <p className="info-message">No comments yet.</p>
                ) : (
                    <div className="comment-list">
                        {comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.username || 'Unknown'}</span>
                                    {comment.createdAt && (
                                        <span className="comment-date">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

