
'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase, peso } from '../lib/supabase'
import AuthGate from '../components/AuthGate'
import Nav from '../components/Nav'

type Tx = {
  date: string
  type: 'income'|'expense'
  amount: number
}

function monthKey(d:string){ return d.slice(0,7) }

export default function Comparison(){
  const [tx,setTx] = useState<Tx[]>([])

  useEffect(()=>{
    (async()=>{
      const { data, error } = await supabase
        .from('transactions')
        .select('date,type,amount')
        .order('date',{ascending:true})
      if(error) alert(error.message)
      else setTx(data || [])
    })()
  },[])

  const monthly = useMemo(()=>{
    const map: Record<string,{income:number;expense:number;orders:number}> = {}
    tx.forEach(t=>{
      const k = monthKey(t.date)
      if(!map[k]) map[k] = {income:0,expense:0,orders:0}
      if(t.type === 'income'){
        map[k].income += t.amount || 0
        map[k].orders += 1
      }else{
        map[k].expense += t.amount || 0
      }
    })
    return Object.entries(map)
      .map(([month,v]) => ({
        month,
        income: v.income,
        expense: v.expense,
        net: v.income - v.expense,
        orders: v.orders
      }))
      .sort((a,b)=>a.month.localeCompare(b.month))
  },[tx])

  const avgSales = monthly.length
    ? monthly.reduce((s,m)=>s+m.income,0) / monthly.length
    : 0

  const avgNet = monthly.length
    ? monthly.reduce((s,m)=>s+m.net,0) / monthly.length
    : 0

  let growth = 0
  if(monthly.length >= 2){
    const first = monthly[0].income
    const last = monthly[monthly.length-1].income
    if(first > 0){
      growth = (last - first) / first
    }
  }

  return (
    <AuthGate>
      <Nav/>
      <div className="container">
        <h1>Comparison & Averages</h1>
        <div className="row">
          <div className="card kpi">
            <div className="title">AVERAGE SALES (PER MONTH)</div>
            <div className="value">{peso.format(avgSales)}</div>
          </div>
          <div className="card kpi">
            <div className="title">AVERAGE NET PROFIT (PER MONTH)</div>
            <div className="value">{peso.format(avgNet)}</div>
          </div>
          <div className="card kpi">
            <div className="title">GROWTH (SALES: FIRST → LAST MONTH)</div>
            <div className="value">{(growth*100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="card">
          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Sales (Income)</th>
                <th>Expenses</th>
                <th>Net</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map(m=>(
                <tr key={m.month}>
                  <td>{m.month}</td>
                  <td>{peso.format(m.income)}</td>
                  <td>{peso.format(m.expense)}</td>
                  <td>{peso.format(m.net)}</td>
                  <td>{m.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGate>
  )
}
