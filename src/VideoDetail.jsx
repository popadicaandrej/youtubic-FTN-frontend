import { useEffect, useState, useRef } from 'react'
import { apiFetch } from './api'
import { useAuth } from './AuthContext'

export default function VideoDetail({ videoId, onBack }) {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [liking, setLiking] = useState(false)
    const [comments, setComments] = useState({
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 20
    })
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentsError, setCommentsError] = useState(null)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [likeError, setLikeError] = useState(null)
    const [commentError, setCommentError] = useState(null)
    const { isAuthenticated } = useAuth()
    const commentsSectionRef = useRef(null)

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

    async function fetchComments(page = 0, size = 20, forceRefresh = false) {
        if (!post || !post.id) {
            return
        }

        if (loadingComments && !forceRefresh) {
            return
        }

        if (page < 0) {
            page = 0
        }

        if (size <= 0) {
            size = 20
        }

        if (!forceRefresh && comments.currentPage === page && comments.pageSize === size && comments.content.length > 0 && !commentsError) {
            return
        }

        try {
            setLoadingComments(true)
            setCommentsError(null)
            const res = await apiFetch(`/api/posts/${post.id}/comments?page=${page}&size=${size}`)
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Post not found.')
                } else if (res.status === 400) {
                    const errorData = await res.json().catch(() => ({}))
                    throw new Error(errorData.error || 'Invalid request. Please try again.')
                } else if (res.status === 401) {
                    throw new Error('You must be logged in to view comments.')
                } else if (res.status === 403) {
                    throw new Error('You do not have permission to view comments.')
                } else if (res.status === 429) {
                    throw new Error('Too many requests. Please try again later.')
                } else if (res.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    const errorData = await res.json().catch(() => ({}))
                    throw new Error(errorData.error || 'Error loading comments.')
                }
            }
            
            let data
            try {
                data = await res.json()
            } catch (parseError) {
                throw new Error('Invalid response from server. Please try again.')
            }
            
            if (data.content && Array.isArray(data.content)) {
                setComments({
                    content: data.content,
                    totalElements: data.totalElements || 0,
                    totalPages: data.totalPages || 0,
                    currentPage: data.currentPage || 0,
                    pageSize: data.pageSize || 20
                })
                if (commentsSectionRef.current) {
                    commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            } else {
                if (page === 0) {
                    setComments({
                        content: [],
                        totalElements: 0,
                        totalPages: 0,
                        currentPage: 0,
                        pageSize: 20
                    })
                } else {
                    throw new Error('Invalid response format from server.')
                }
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setCommentsError('Network error. Please check your connection and try again.')
            } else {
                setCommentsError(err.message || 'Error loading comments.')
            }
            if (page === 0) {
                setComments({
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    currentPage: 0,
                    pageSize: 20
                })
            }
        } finally {
            setLoadingComments(false)
        }
    }

    useEffect(() => {
        if (!post || !post.id) {
            return
        }

        if (loadingComments) {
            return
        }

        setComments({
            content: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: 20
        })
        fetchComments(0, 20)
    }, [post?.id])

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

        if (!post || !post.id) {
            setCommentError('Post not found.')
            return
        }

        if (submittingComment) {
            return
        }

        const trimmedText = commentText.trim()
        
        if (!trimmedText) {
            setCommentError('Comment cannot be empty.')
            return
        }

        if (trimmedText.length > 1000) {
            setCommentError('Comment cannot exceed 1000 characters.')
            return
        }

        try {
            setSubmittingComment(true)
            setCommentError(null)
            const postId = post.id
            if (!postId) {
                setCommentError('Post ID is missing.')
                return
            }
            const res = await apiFetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: trimmedText
                })
            })

            if (!res.ok) {
                if (res.status === 401) {
                    setCommentError('You must login to comment.')
                    return
                } else if (res.status === 400) {
                    const errorData = await res.json().catch(() => ({}))
                    let errorMessage = errorData.error
                    if (!errorMessage && errorData.text) {
                        errorMessage = errorData.text
                    }
                    if (!errorMessage && errorData.postId) {
                        errorMessage = errorData.postId
                    }
                    if (!errorMessage) {
                        const firstError = Object.values(errorData)[0]
                        errorMessage = typeof firstError === 'string' ? firstError : 'Invalid comment. Please check your input.'
                    }
                    setCommentError(errorMessage || 'Invalid comment. Please check your input.')
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
            
            setPost(prevPost => ({
                ...prevPost,
                commentsCount: (prevPost.commentsCount || 0) + 1
            }))
            
            const pageSize = comments.pageSize || 20
            await fetchComments(0, pageSize, true)
            
            setSubmittingComment(false)
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

            <div className="comments-section" ref={commentsSectionRef}>
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
                        <div className="comment-char-count">
                            {commentText.length}/1000 characters
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={submittingComment || !commentText.trim() || commentText.trim().length > 1000}
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

                {commentsError ? (
                    <p className="error-message">{commentsError}</p>
                ) : comments.content.length === 0 && !loadingComments ? (
                    <p className="info-message">No comments yet.</p>
                ) : (
                    <>
                        {loadingComments && comments.content.length === 0 && (
                            <p>Loading comments...</p>
                        )}
                        {comments.content.length > 0 && (
                            <div className="comment-list">
                                {loadingComments && comments.content.length > 0 && (
                                    <p className="loading-indicator">Loading...</p>
                                )}
                                {comments.content.map(comment => (
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
                        {comments.content.length > 0 && comments.totalElements > 0 && (
                            <div className="comments-pagination-info">
                                {(() => {
                                    const start = Math.max(1, comments.currentPage * comments.pageSize + 1)
                                    const end = Math.min(comments.currentPage * comments.pageSize + comments.content.length, comments.totalElements)
                                    if (start > end) {
                                        return `Showing 0 of ${comments.totalElements} ${comments.totalElements === 1 ? 'comment' : 'comments'}`
                                    }
                                    return `Showing ${start}-${end} of ${comments.totalElements} ${comments.totalElements === 1 ? 'comment' : 'comments'}`
                                })()}
                            </div>
                        )}
                        {comments.totalPages > 1 && comments.totalElements > 0 && (
                            <div className="comments-pagination">
                                <button
                                    onClick={() => {
                                        const prevPage = Math.max(0, comments.currentPage - 1)
                                        fetchComments(prevPage, comments.pageSize)
                                    }}
                                    disabled={comments.currentPage === 0 || loadingComments || comments.currentPage >= comments.totalPages}
                                    className="pagination-button"
                                >
                                    {loadingComments ? 'Loading...' : 'Previous'}
                                </button>
                                <span className="pagination-info">
                                    Page {Math.min(comments.currentPage + 1, comments.totalPages)} of {comments.totalPages}
                                </span>
                                <button
                                    onClick={() => {
                                        const nextPage = Math.min(comments.totalPages - 1, comments.currentPage + 1)
                                        fetchComments(nextPage, comments.pageSize)
                                    }}
                                    disabled={comments.currentPage >= comments.totalPages - 1 || loadingComments || comments.currentPage < 0}
                                    className="pagination-button"
                                >
                                    {loadingComments ? 'Loading...' : 'Next'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}


