
'use client'
import { useEffect, useState } from 'react'
import { supabase, peso } from '../lib/supabase'
import AuthGate from '../components/AuthGate'
import Nav from '../components/Nav'

type Bal = {
  id: string
  kind: 'capital'|'cash'|'gcash'|'bank'
  label: string | null
  amount: number
}

export default function Balances(){
  const [rows,setRows] = useState<Bal[]>([])
  const [form,setForm] = useState<{kind:'capital'|'cash'|'gcash'|'bank';label:string;amount:number}>({
    kind:'capital',
    label:'',
    amount:0
  })

  async function load(){
    const { data, error } = await supabase
      .from('balances')
      .select('*')
      .order('kind',{ascending:true})
    if(error) alert(error.message)
    else setRows(data || [])
  }
  useEffect(()=>{ load() },[])

  async function saveNew(){
    const { error } = await supabase.from('balances').insert({
      kind: form.kind,
      label: form.label,
      amount: form.amount
    })
    if(error) alert(error.message)
    else{
      setForm({kind:'capital',label:'',amount:0})
      load()
    }
  }

  async function updateRow(b:Bal){
    const { error } = await supabase
      .from('balances')
      .update({ label: b.label, amount: b.amount })
      .eq('id', b.id)
    if(error) alert(error.message)
    else load()
  }

  async function del(id:string){
    if(!confirm('Delete this balance row?')) return
    const { error } = await supabase.from('balances').delete().eq('id', id)
    if(error) alert(error.message)
    else load()
  }

  const totalCapital = rows.filter(r=>r.kind==='capital').reduce((s,r)=>s+r.amount,0)
  const totalWallets = rows.filter(r=>r.kind!=='capital').reduce((s,r)=>s+r.amount,0)

  return (
    <AuthGate>
      <Nav/>
      <div className="container">
        <h1>Balances</h1>
        <div className="row">
          <div className="card kpi">
            <div className="title">TOTAL CAPITAL</div>
            <div className="value">{peso.format(totalCapital)}</div>
          </div>
          <div className="card kpi">
            <div className="title">CASH ON HAND (Cash + GCash + Bank)</div>
            <div className="value">{peso.format(totalWallets)}</div>
          </div>
        </div>

        <div className="card">
          <h2>Add Balance Row</h2>
          <div className="row">
            <select
              value={form.kind}
              onChange={e=>setForm({...form,kind:e.target.value as any})}
            >
              <option value="capital">capital</option>
              <option value="cash">cash</option>
              <option value="gcash">gcash</option>
              <option value="bank">bank</option>
            </select>
            <input
              placeholder="Label (e.g., Initial Capital, GCash 1)"
              value={form.label}
              onChange={e=>setForm({...form,label:e.target.value})}
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount || ''}
              onChange={e=>setForm({...form,amount:parseFloat(e.target.value) || 0})}
            />
            <button onClick={saveNew}>Save</button>
          </div>
        </div>

        <div className="card">
          <h2>All Balances</h2>
          <table>
            <thead>
              <tr>
                <th>Kind</th>
                <th>Label</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{r.kind}</td>
                  <td>
                    <input
                      value={r.label || ''}
                      onChange={e=>setRows(rows.map(x=>x.id===r.id?{...x,label:e.target.value}:x))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.amount}
                      onChange={e=>setRows(rows.map(x=>x.id===r.id?{...x,amount:parseFloat(e.target.value) || 0}:x))}
                    />
                  </td>
                  <td>
                    <button onClick={()=>updateRow(r)}>Update</button>
                    <button onClick={()=>del(r.id)} style={{marginLeft:6}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="actions" style={{marginTop:10}}>
            <button onClick={()=>downloadCSV(rows)}>Download CSV</button>
            <button onClick={()=>window.print()}>Print</button>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

function downloadCSV(rows:Bal[]){
  if(!rows.length) return
  const header = ['kind','label','amount']
  const csv = [header.join(',')]
    + '\n'
    + rows.map(r=> header.map(h => (r as any)[h] ?? '').join(',')).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'balances.csv'
  a.click()
  URL.revokeObjectURL(url)
}
