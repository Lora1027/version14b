
'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [mode,setMode] = useState<'signup'|'signin'>('signup')

  async function go(){
    const action = mode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password })
    const { error } = await action
    if(error) alert(error.message)
    else window.location.href = '/'
  }

  return (
    <div className="container">
      <Nav/>
      <div className="card" style={{maxWidth:480}}>
        <h1>{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
        <div className="row">
          <input
            style={{flex:1}}
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />
          <input
            style={{flex:1}}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
        </div>
        <div className="actions" style={{marginTop:10}}>
          <button onClick={go}>
            {mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
          <button type="button" onClick={()=>setMode(mode === 'signup' ? 'signin' : 'signup')}>
            Switch to {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </div>
        <small className="muted">
          If signing up, confirm the email from Supabase then log in.
        </small>
      </div>
    </div>
  )
}
