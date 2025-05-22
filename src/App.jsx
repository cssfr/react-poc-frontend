import React, { useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  const signIn = async () => {
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (err) {
      setError(err.message)
      return
    }
    setError(null)
  }

  const fetchItems = async () => {
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession()

    if (sessionErr || !session) {
      setError(sessionErr?.message || 'Not authenticated')
      return
    }

    const token = session.access_token
    const res = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const { detail } = await res.json()
      setError(detail)
      return
    }

    setItems(await res.json())
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button onClick={signIn} className="bg-blue-500 text-white px-4 py-2 rounded">
        Sign In
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      <button onClick={fetchItems} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
        Get Items
      </button>
      <ul className="mt-4">
        {items.map(i => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
