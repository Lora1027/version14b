
'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase, peso } from '../lib/supabase'
import AuthGate from '../components/AuthGate'
import Nav from '../components/Nav'

type Tx = {
  id: string
  date: string
  type: 'income'|'expense'
  category: string | null
  method: string | null
  amount: number
  notes: string | null
}

export default function Transactions(){
  const [tx,setTx] = useState<Tx[]>([])
  const [q,setQ] = useState('')
  const [typeFilter,setTypeFilter] = useState<'all'|'income'|'expense'>('all')
  const [methodFilter,setMethodFilter] = useState<'all'|'cash'|'gcash'|'bank'>('all')

  useEffect(()=>{ load() },[])

  async function load(){
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date',{ascending:false})
    if(error) alert(error.message)
    else setTx(data || [])
  }

  const filtered = useMemo(()=>{
    return tx.filter(t=>{
      if(typeFilter !== 'all' && t.type !== typeFilter) return false
      if(methodFilter !== 'all' && t.method !== methodFilter) return false
      const text = ((t.category || '') + ' ' + (t.notes || '')).toLowerCase()
      return text.includes(q.toLowerCase())
    })
  },[tx,q,typeFilter,methodFilter])

  async function del(id:string){
    if(!confirm('Delete this transaction?')) return
    const { error } = await supabase.from('transactions').delete().eq('id',id)
    if(error) alert(error.message)
    else setTx(list=>list.filter(t=>t.id!==id))
  }

  return (
    <AuthGate>
      <Nav/>
      <div className="container">
        <h1>Transactions</h1>
        <div className="card row">
          <input
            placeholder="Search by category or notes"
            value={q}
            onChange={e=>setQ(e.target.value)}
            style={{flex:1}}
          />
          <select
            value={typeFilter}
            onChange={e=>setTypeFilter(e.target.value as any)}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={methodFilter}
            onChange={e=>setMethodFilter(e.target.value as any)}
          >
            <option value="all">All methods</option>
            <option value="cash">cash</option>
            <option value="gcash">gcash</option>
            <option value="bank">bank</option>
          </select>
          <button onClick={()=>downloadCSV(filtered)}>Download CSV</button>
          <button onClick={()=>window.print()}>Print</button>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.type}</td>
                  <td>{t.category}</td>
                  <td>{t.method}</td>
                  <td>{peso.format(t.amount || 0)}</td>
                  <td>{t.notes}</td>
                  <td>
                    <button onClick={()=>del(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGate>
  )
}

function downloadCSV(rows:Tx[]){
  if(!rows.length) return
  const header = ['date','type','category','method','amount','notes']
  const csv = [header.join(',')]
    + '\n'
    + rows.map(r=> header.map(h => (r as any)[h] ?? '').join(',')).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}
