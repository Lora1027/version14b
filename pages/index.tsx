
'use client'
import { useEffect, useState } from 'react'
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

type Bal = {
  id: string
  kind: 'capital'|'cash'|'gcash'|'bank'
  label: string | null
  amount: number
}

export default function Dashboard(){
  const [tx,setTx] = useState<Tx[]>([])
  const [bal,setBal] = useState<Bal[]>([])

  useEffect(()=>{
    (async()=>{
      const { data: t } = await supabase.from('transactions').select('*').order('date',{ascending:true})
      setTx(t || [])
      const { data: b } = await supabase.from('balances').select('*')
      setBal(b || [])
    })()
  },[])

  const totalIncome = tx.filter(t=>t.type==='income').reduce((s,t)=>s+(t.amount||0),0)
  const totalExpense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+(t.amount||0),0)
  const net = totalIncome - totalExpense

  const capital = bal.filter(b=>b.kind==='capital').reduce((s,b)=>s+b.amount,0)
  const wallets = bal.filter(b=>b.kind!=='capital').reduce((s,b)=>s+b.amount,0)

  return (
    <AuthGate>
      <Nav/>
      <div className="container">
        <h1>Dashboard</h1>
        <div className="row">
          <div className="card kpi">
            <div className="title">TOTAL SALES (ALL TIME)</div>
            <div className="value">{peso.format(totalIncome)}</div>
          </div>
          <div className="card kpi">
            <div className="title">TOTAL EXPENSES (ALL TIME)</div>
            <div className="value">{peso.format(totalExpense)}</div>
          </div>
          <div className="card kpi">
            <div className="title">NET PROFIT (ALL TIME)</div>
            <div className="value">{peso.format(net)}</div>
          </div>
          <div className="card kpi">
            <div className="title">CAPITAL</div>
            <div className="value">{peso.format(capital)}</div>
          </div>
          <div className="card kpi">
            <div className="title">CASH ON HAND (Cash + GCash + Bank)</div>
            <div className="value">{peso.format(wallets)}</div>
          </div>
        </div>

        <div className="card">
          <h2>Quick Add Transaction</h2>
          <QuickAdd onSaved={()=>window.location.reload()} />
        </div>
      </div>
    </AuthGate>
  )
}

function QuickAdd({ onSaved }: { onSaved: () => void }){
  const [date,setDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [type,setType] = useState<'income'|'expense'>('income')
  const [category,setCategory] = useState<string>('Sales')
  const [method,setMethod] = useState<string>('cash')
  const [amount,setAmount] = useState<number>(0)
  const [notes,setNotes] = useState<string>('')

  async function save(){
    const { error } = await supabase.from('transactions').insert({
      date, type, category, method, amount, notes
    })
    if(error){
      alert('Save failed: ' + error.message)
    }else{
      alert('Saved')
      onSaved()
    }
  }

  return (
    <div className="row">
      <input
        type="date"
        value={date}
        onChange={e=>setDate(e.target.value)}
      />
      <select
        value={type}
        onChange={e=>setType(e.target.value as 'income'|'expense')}
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        value={category}
        onChange={e=>setCategory(e.target.value)}
        placeholder="Category"
        style={{minWidth:150}}
      />
      <select
        value={method}
        onChange={e=>setMethod(e.target.value)}
      >
        <option value="cash">cash</option>
        <option value="gcash">gcash</option>
        <option value="bank">bank</option>
      </select>
      <input
        type="number"
        value={amount || ''}
        onChange={e=>setAmount(parseFloat(e.target.value) || 0)}
        placeholder="Amount"
      />
      <input
        value={notes}
        onChange={e=>setNotes(e.target.value)}
        placeholder="Notes"
        style={{flex:1}}
      />
      <button onClick={save}>Add</button>
    </div>
  )
}
