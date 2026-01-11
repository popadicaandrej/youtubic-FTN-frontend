import { useEffect, useState } from 'react'

export default function Feed({ onOpenProfile }) {
    const [posts, setPosts] = useState([])

    useEffect(() => {
        fetch('/api/posts')
            .then(r => r.json())
            .then(setPosts)
    }, [])

    function needLogin() {
        alert('Morate se prijaviti da biste koristili ovu opciju.')
    }

    return (
        <main className="feed">
            {posts.map(p => (
                <div className="post" key={p.id}>
                    <div className="post-header">
                        <img src="https://via.placeholder.com/40" />
                        <span
                            className="username"
                            onClick={() => onOpenProfile(p.authorId)}
                        >
              {p.authorUsername}
            </span>
                    </div>

                    <h3>{p.title}</h3>
                    <p>{p.content}</p>

                    <div className="actions">
                        <button onClick={needLogin}>👍 {p.likes}</button>
                        <button onClick={needLogin}>💬 {p.comments}</button>
                    </div>
                </div>
            ))}
        </main>
    )
}