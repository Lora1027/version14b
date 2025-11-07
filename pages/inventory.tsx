'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase, peso } from '../lib/supabase'
import AuthGate from '../components/AuthGate'
import Nav from '../components/Nav'

type Item = {
  id: string
  name: string
  sku: string | null
  category: string | null
  cost: number | null
  price: number | null
  stock: number | null
}

export default function InventoryPage(){
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')

  // single item form
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [cost, setCost] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')
  const [stock, setStock] = useState<number | ''>('')

  // bulk textarea
  const [bulkText, setBulkText] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      alert(error.message)
    } else {
      setItems(data || [])
    }
  }

  async function addSingle() {
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    const { error } = await supabase.from('inventory').insert({
      name: name.trim(),
      sku: sku || null,
      category: category || null,
      cost: cost === '' ? null : cost,
      price: price === '' ? null : price,
      stock: stock === '' ? 0 : stock,
    })
    if (error) {
      alert('Save failed: ' + error.message)
    } else {
      setName('')
      setSku('')
      setCategory('')
      setCost('')
      setPrice('')
      setStock('')
      await load()
    }
  }

  // Bulk format:
  // one item per line:
  // Name,Stock,Cost,Price
  async function addBulk() {
    if (!bulkText.trim()) {
      alert('No data to import')
      return
    }

    const rows = bulkText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const toInsert: any[] = []

    for (const line of rows) {
      const parts = line.split(',').map(p => p.trim())
      if (!parts[0]) continue

      const [n, stockStr, costStr, priceStr] = parts

      toInsert.push({
        name: n,
        stock: stockStr ? parseInt(stockStr) || 0 : 0,
        cost: costStr ? parseFloat(costStr) || null : null,
        price: priceStr ? parseFloat(priceStr) || null : null,
      })
    }

    if (!toInsert.length) {
      alert('No valid rows found')
      return
    }

    const { error } = await supabase.from('inventory').insert(toInsert)
    if (error) {
      alert('Bulk import failed: ' + error.message)
    } else {
      setBulkText('')
      await load()
    }
  }

  async function updateItem(updated: Item) {
    const { error } = await supabase
      .from('inventory')
      .update({
        name: updated.name,
        sku: updated.sku,
        category: updated.category,
        cost: updated.cost,
        price: updated.price,
        stock: updated.stock,
      })
      .eq('id', updated.id)
    if (error) {
      alert('Update failed: ' + error.message)
    } else {
      await load()
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setItems(list => list.filter(i => i.id !== id))
    }
  }

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return items.filter(i =>
      (i.name || '').toLowerCase().includes(term) ||
      (i.sku || '').toLowerCase().includes(term) ||
      (i.category || '').toLowerCase().includes(term)
    )
  }, [items, q])

  function downloadCSV(rows: Item[]) {
    if (!rows.length) return
    const header = ['name', 'sku', 'category', 'cost', 'price', 'stock']
    const csv =
      header.join(',') + '\n' +
      rows.map(r =>
        [
          r.name || '',
          r.sku || '',
          r.category || '',
          r.cost ?? '',
          r.price ?? '',
          r.stock ?? '',
        ].join(',')
      ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalStockValue = filtered.reduce((sum, i) => {
    const c = i.cost || 0
    const s = i.stock || 0
    return sum + c * s
  }, 0)

  return (
    <AuthGate>
      <Nav/>
      <div className="container">
        <h1>Inventory</h1>

        <div className="row">
          <div className="card kpi">
            <div className="title">TOTAL ITEMS</div>
            <div className="value">{filtered.length}</div>
          </div>
          <div className="card kpi">
            <div className="title">TOTAL STOCK VALUE (using cost)</div>
            <div className="value">{peso.format(totalStockValue)}</div>
          </div>
        </div>

        {/* Single item add */}
        <div className="card">
          <h2>Add Single Item</h2>
          <div className="row">
            <input
              placeholder="Name *"
              value={name}
              onChange={e=>setName(e.target.value)}
              style={{minWidth:160}}
            />
            <input
              placeholder="SKU / Code"
              value={sku}
              onChange={e=>setSku(e.target.value)}
            />
            <input
              placeholder="Category"
              value={category}
              onChange={e=>setCategory(e.target.value)}
            />
            <input
              type="number"
              placeholder="Cost"
              value={cost === '' ? '' : cost}
              onChange={e=>setCost(e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
            />
            <input
              type="number"
              placeholder="Price"
              value={price === '' ? '' : price}
              onChange={e=>setPrice(e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
            />
            <input
              type="number"
              placeholder="Stock"
              value={stock === '' ? '' : stock}
              onChange={e=>setStock(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
            />
            <button onClick={addSingle}>Add</button>
          </div>
        </div>

        {/* Bulk add */}
        <div className="card">
          <h2>Bulk Import</h2>
          <p className="muted">
            Format: <code>Name,Stock,Cost,Price</code> — one item per line. Cost/Price optional.
          </p>
          <textarea
            style={{width:'100%', minHeight:120}}
            value={bulkText}
            onChange={e=>setBulkText(e.target.value)}
            placeholder={
`Example:
Juice A 30ml,10,120,180
Pod Device X,5,800,1200`
            }
          />
          <div className="actions" style={{marginTop:8}}>
            <button onClick={addBulk}>Import Lines</button>
          </div>
        </div>

        {/* List */}
        <div className="card">
          <h2>Inventory List</h2>
          <div className="row">
            <input
              placeholder="Search by name / SKU / category"
              value={q}
              onChange={e=>setQ(e.target.value)}
              style={{flex:1}}
            />
            <button onClick={()=>downloadCSV(filtered)}>Download CSV</button>
            <button onClick={()=>window.print()}>Print</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i=>(
                <InventoryRow
                  key={i.id}
                  item={i}
                  onChange={updateItem}
                  onDelete={del}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGate>
  )
}

function InventoryRow({
  item,
  onChange,
  onDelete
}:{
  item: Item
  onChange: (i: Item) => void
  onDelete: (id: string) => void
}){
  const [draft, setDraft] = useState<Item>(item)

  useEffect(()=>{ setDraft(item) }, [item.id])

  return (
    <tr>
      <td>
        <input
          value={draft.name}
          onChange={e=>setDraft({...draft, name: e.target.value})}
        />
      </td>
      <td>
        <input
          value={draft.sku || ''}
          onChange={e=>setDraft({...draft, sku: e.target.value})}
        />
      </td>
      <td>
        <input
          value={draft.category || ''}
          onChange={e=>setDraft({...draft, category: e.target.value})}
        />
      </td>
      <td>
        <input
          type="number"
          value={draft.cost ?? ''}
          onChange={e=>setDraft({
            ...draft,
            cost: e.target.value === '' ? null : (parseFloat(e.target.value) || 0)
          })}
        />
      </td>
      <td>
        <input
          type="number"
          value={draft.price ?? ''}
          onChange={e=>setDraft({
            ...draft,
            price: e.target.value === '' ? null : (parseFloat(e.target.value) || 0)
          })}
        />
      </td>
      <td>
        <input
          type="number"
          value={draft.stock ?? ''}
          onChange={e=>setDraft({
            ...draft,
            stock: e.target.value === '' ? null : (parseInt(e.target.value) || 0)
          })}
        />
      </td>
      <td>
        <button onClick={()=>onChange(draft)}>Update</button>
        <button onClick={()=>onDelete(item.id)} style={{marginLeft:6}}>Delete</button>
      </td>
    </tr>
  )
}
