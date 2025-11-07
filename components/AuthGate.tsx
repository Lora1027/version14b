
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function AuthGate({ children }: { children: any }){
  const [ready,setReady] = useState(false)
  const router = useRouter()

  useEffect(()=>{
    supabase.auth.getUser().then(({ data })=>{
      if(!data.user){
        router.push('/login')
      }else{
        setReady(true)
      }
    })
  },[router])

  if(!ready){
    return (
      <div className="container">
        <div className="card">Checking session…</div>
      </div>
    )
  }

  return children
}
