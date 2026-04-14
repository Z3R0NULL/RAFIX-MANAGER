import React, { useState } from 'react'
import {
  User, Smartphone, Shield, Stethoscope, CheckSquare, DollarSign, ChevronDown, ChevronUp, X
} from 'lucide-react'
import { DEVICE_TYPES, ACCESSORIES_OPTIONS, STATUS_CONFIG } from '../utils/constants'

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-indigo-500" />
          <span className="font-semibold text-slate-900 dark:text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

const Field = ({ label, required, children, half }) => (
  <div className={half ? 'col-span-1' : 'col-span-2 sm:col-span-1'}>
    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
)

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition'

const selectClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer'

const TriState = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex gap-1">
      {[true, false, null].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === v
              ? v === true
                ? 'bg-green-500 text-white'
                : v === false
                ? 'bg-red-500 text-white'
                : 'bg-slate-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {v === true ? 'Yes' : v === false ? 'No' : 'N/A'}
        </button>
      ))}
    </div>
  </div>
)

export default function OrderForm({ initialData, onSubmit, onCancel, submitLabel = 'Save Order', isLoading }) {
  const [form, setForm] = useState(() => ({
    // Customer
    customerName: '',
    customerDni: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    // Device
    deviceType: 'phone',
    deviceBrand: '',
    deviceModel: '',
    deviceSerial: '',
    deviceEmail: '',
    accessories: [],
    // Security
    devicePassword: '',
    lockNotes: '',
    // Diagnosis
    reportedIssue: '',
    technicianNotes: '',
    waterDamage: false,
    physicalDamage: false,
    previouslyOpened: false,
    // Checklist
    powersOn: null,
    charges: null,
    screenWorks: null,
    touchWorks: null,
    audioWorks: null,
    buttonsWork: null,
    // Budget
    estimatedPrice: '',
    finalPrice: '',
    repairCost: '',
    budgetStatus: 'pending',
    // Work done
    workDone: '',
    // Status
    status: 'pending',
    statusNote: '',
    ...initialData,
  }))

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key) => set(key, !form[key])
  const toggleAccessory = (acc) => {
    set('accessories', form.accessories.includes(acc)
      ? form.accessories.filter((a) => a !== acc)
      : [...form.accessories, acc])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer */}
      <Section title="Customer Information" icon={User}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input className={inputClass} value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="John Doe" required />
          </Field>
          <Field label="ID / DNI">
            <input className={inputClass} value={form.customerDni} onChange={(e) => set('customerDni', e.target.value)} placeholder="123456789" />
          </Field>
          <Field label="Phone (WhatsApp)">
            <input className={inputClass} type="tel" value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder="customer@email.com" />
          </Field>
          <div className="col-span-2">
            <Field label="Address (optional)">
              <input className={inputClass} value={form.customerAddress} onChange={(e) => set('customerAddress', e.target.value)} placeholder="Street, City, ZIP" />
            </Field>
          </div>
        </div>
      </Section>

      {/* Device */}
      <Section title="Device Information" icon={Smartphone}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Device Type" required>
            <select className={selectClass} value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)} required>
              {DEVICE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Brand">
            <input className={inputClass} value={form.deviceBrand} onChange={(e) => set('deviceBrand', e.target.value)} placeholder="Apple, Samsung, HP..." />
          </Field>
          <Field label="Model">
            <input className={inputClass} value={form.deviceModel} onChange={(e) => set('deviceModel', e.target.value)} placeholder="iPhone 14 Pro, Galaxy S23..." />
          </Field>
          <Field label="Serial Number / IMEI">
            <input className={inputClass} value={form.deviceSerial} onChange={(e) => set('deviceSerial', e.target.value)} placeholder="SN or IMEI" />
          </Field>
          <div className="col-span-2">
            <Field label="Associated Email">
              <input className={inputClass} type="email" value={form.deviceEmail} onChange={(e) => set('deviceEmail', e.target.value)} placeholder="icloud@email.com" />
            </Field>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Accessories Received</label>
            <div className="flex flex-wrap gap-2">
              {ACCESSORIES_OPTIONS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleAccessory(acc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.accessories.includes(acc)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security / Lock Info" icon={Shield} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Password / PIN / Pattern">
            <input className={inputClass} value={form.devicePassword} onChange={(e) => set('devicePassword', e.target.value)} placeholder="Device unlock code" />
          </Field>
          <div className="col-span-2">
            <Field label="Lock Status Notes">
              <textarea className={`${inputClass} resize-none`} rows={2} value={form.lockNotes} onChange={(e) => set('lockNotes', e.target.value)} placeholder="Any notes about locked accounts, Find My, etc." />
            </Field>
          </div>
        </div>
      </Section>

      {/* Diagnosis */}
      <Section title="Diagnosis" icon={Stethoscope}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Customer-Reported Issue <span className="text-red-400">*</span></label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.reportedIssue} onChange={(e) => set('reportedIssue', e.target.value)} placeholder="What the customer says is wrong with the device..." required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Technician Observations</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.technicianNotes} onChange={(e) => set('technicianNotes', e.target.value)} placeholder="Internal notes from technician..." />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'waterDamage', label: 'Water Damage', color: 'blue' },
              { key: 'physicalDamage', label: 'Physical Damage', color: 'orange' },
              { key: 'previouslyOpened', label: 'Previously Opened', color: 'yellow' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  form[key]
                    ? color === 'blue'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : color === 'orange'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${form[key] ? (color === 'blue' ? 'bg-blue-500' : color === 'orange' ? 'bg-orange-500' : 'bg-yellow-500') : 'bg-slate-300 dark:bg-slate-600'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Checklist */}
      <Section title="Technical Checklist" icon={CheckSquare} defaultOpen={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <TriState label="Powers On" value={form.powersOn} onChange={(v) => set('powersOn', v)} />
          <TriState label="Charges" value={form.charges} onChange={(v) => set('charges', v)} />
          <TriState label="Screen Works" value={form.screenWorks} onChange={(v) => set('screenWorks', v)} />
          <TriState label="Touch Works" value={form.touchWorks} onChange={(v) => set('touchWorks', v)} />
          <TriState label="Audio Works" value={form.audioWorks} onChange={(v) => set('audioWorks', v)} />
          <TriState label="Buttons Work" value={form.buttonsWork} onChange={(v) => set('buttonsWork', v)} />
        </div>
      </Section>

      {/* Budget */}
      <Section title="Budget & Pricing" icon={DollarSign} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimated Price">
            <input className={inputClass} type="number" step="0.01" min="0" value={form.estimatedPrice} onChange={(e) => set('estimatedPrice', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Final Price">
            <input className={inputClass} type="number" step="0.01" min="0" value={form.finalPrice} onChange={(e) => set('finalPrice', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Repair Cost (parts + labor)">
            <input className={inputClass} type="number" step="0.01" min="0" value={form.repairCost} onChange={(e) => set('repairCost', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Budget Status">
            <select className={selectClass} value={form.budgetStatus} onChange={(e) => set('budgetStatus', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Work Done / Services Rendered">
              <textarea className={`${inputClass} resize-none`} rows={3} value={form.workDone} onChange={(e) => set('workDone', e.target.value)} placeholder="Describe what was done, parts replaced, etc." />
            </Field>
          </div>
        </div>
      </Section>

      {/* Status */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Order Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current Status">
            <select className={selectClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status Note">
            <input className={inputClass} value={form.statusNote} onChange={(e) => set('statusNote', e.target.value)} placeholder="Optional note for this status change" />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
