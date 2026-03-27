// FILE: src/app/(dashboard)/admin/hr/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Table, Tr, Td, Badge, Button, Modal, Input, Alert, Spinner, EmptyState } from '@/components/ui'
import { Briefcase } from 'lucide-react'
 
export default function HRClient() {
  const [tab,    setTab]    = useState<'staff'|'payroll'|'leaves'>('staff')
  const [staff,  setStaff]  = useState<any[]>([])
  const [loading,setLoading]= useState(true)
  const [alert,  setAlert]  = useState<{type:'success'|'error';msg:string}|null>(null)
  const [month,  setMonth]  = useState(new Date().toISOString().slice(0,7))
 
  useEffect(()=>{
    setLoading(true)
    fetch('/api/users?role=teacher')
      .then(r=>r.json())
      .then(d=>{setStaff(d.users??[]);setLoading(false)})
  },[])
 
  const generateSalarySlips = async () => {
    const res = await fetch('/api/hr/salary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    })
    const d = await res.json()
    if (res.ok) setAlert({ type:'success', msg:`${d.generated} salary slips generated for ${month}` })
    else setAlert({ type:'error', msg: d.error })
  }
 
  return (
    <div>
      <PageHeader title="HR & Payroll" subtitle="Staff management, salary and leaves" />
      {alert && <Alert type={alert.type} message={alert.msg} onClose={()=>setAlert(null)} className="mb-4" />}
 
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-4">
        {(['staff','payroll','leaves'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md capitalize ${tab===t?'bg-white text-slate-800 font-medium shadow-sm':'text-slate-500'}`}>
            {t==='staff'?'👥 Staff':t==='payroll'?'💰 Payroll':'📅 Leaves'}
          </button>
        ))}
      </div>
 
      {tab==='staff' && (
        <Card padding={false}>
          {loading?<div className="flex justify-center py-12"><Spinner size="lg" /></div>:staff.length===0?
            <EmptyState icon={<Briefcase size={24} />} title="No staff added" description="Add teachers and staff from the Teachers section" />:
            <Table headers={['Name','Role','Phone','Subjects','Status']}>
              {staff.map(s=>(
                <Tr key={s._id}>
                  <Td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold">{s.name?.charAt(0)}</div><p className="text-sm font-medium text-slate-700">{s.name}</p></div></Td>
                  <Td><Badge variant="info">{s.role}</Badge></Td>
                  <Td className="font-mono text-sm text-slate-600">{s.phone}</Td>
                  <Td><p className="text-xs text-slate-500 max-w-xs">{(s.subjects??[]).join(', ')||'Not assigned'}</p></Td>
                  <Td><Badge variant={s.isActive?'success':'danger'}>{s.isActive?'Active':'Inactive'}</Badge></Td>
                </Tr>
              ))}
            </Table>
          }
        </Card>
      )}
 
      {tab==='payroll' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Salary Month</label>
                <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="h-9 px-3 text-sm rounded-lg border border-slate-200" />
              </div>
              <Button onClick={generateSalarySlips}>Generate Salary Slips</Button>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">Select a month and click "Generate Salary Slips" to create payroll</p>
              <p className="text-xs mt-2">Salary PDFs will be available for download after generation</p>
            </div>
          </Card>
        </div>
      )}
 
      {tab==='leaves' && (
        <Card padding={false}>
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">Leave management coming soon</p>
            <p className="text-xs mt-2">Staff can apply for leaves and admin can approve/reject</p>
          </div>
        </Card>
      )}
    </div>
  )
}
 