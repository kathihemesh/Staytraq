"use client"

import { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, AlertCircle, Search, Clock, ChevronDown, X, Check, Plus, HelpCircle, SmileIcon, AlertTriangle, AlertOctagon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tenant {
  id: number
  name: string
  room: string
  floor: number
  status: "overdue" | "due_today" | "due_week" | "upcoming" | "paid"
  amount: number
  dueDate: Date
  phone: string
}

type FilterType = "all" | "overdue" | "due_today" | "due_week" | "upcoming" | "paid"
type FloorFilterType = "all" | 1 | 2
type SortType = "urgency" | "due_date" | "name" | "amount" | "room"

const mockTenants: Tenant[] = [
  {
    id: 1,
    name: "Rajesh Sharma",
    room: "R-101",
    floor: 1,
    status: "overdue",
    amount: 8500,
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43210",
  },
  {
    id: 2,
    name: "Priya Desai",
    room: "R-102",
    floor: 1,
    status: "overdue",
    amount: 9000,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43211",
  },
  {
    id: 3,
    name: "Amit Kumar",
    room: "R-103",
    floor: 1,
    status: "due_today",
    amount: 8500,
    dueDate: new Date(),
    phone: "+91 98765 43212",
  },
  {
    id: 4,
    name: "Neha Gupta",
    room: "R-104",
    floor: 1,
    status: "due_week",
    amount: 10000,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43213",
  },
  {
    id: 5,
    name: "Vikram Singh",
    room: "R-105",
    floor: 1,
    status: "due_week",
    amount: 9500,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43214",
  },
  {
    id: 6,
    name: "Sneha Reddy",
    room: "R-201",
    floor: 2,
    status: "due_week",
    amount: 12000,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43215",
  },
  {
    id: 7,
    name: "Deepak Nair",
    room: "R-202",
    floor: 2,
    status: "upcoming",
    amount: 11000,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43216",
  },
  {
    id: 8,
    name: "Arjun Patel",
    room: "R-203",
    floor: 2,
    status: "upcoming",
    amount: 9500,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43217",
  },
  {
    id: 9,
    name: "Pooja Malhotra",
    room: "R-204",
    floor: 2,
    status: "paid",
    amount: 10500,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43218",
  },
  {
    id: 10,
    name: "Rohit Verma",
    room: "R-205",
    floor: 2,
    status: "paid",
    amount: 8500,
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    phone: "+91 98765 43219",
  },
]

const messageTemplates = {
  friendly: `Hi {name}, this is a friendly reminder that your rent of ₹{amount} for {room} is due on {dueDate}. Please make the payment at your earliest convenience. Thank you!`,
  firm: `Dear {name}, your rent payment of ₹{amount} for {room} is now due. Please clear the payment immediately to avoid any inconvenience. Contact us if you have any questions.`,
  final: `URGENT: {name}, your rent of ₹{amount} for {room} is overdue. Immediate payment is required. Please settle this at once to avoid further action.`,
  custom: "",
}

function getRelativeDueDate(dueDate: Date): { label: string; color: string; borderColor: string } {
  const now = new Date()
  const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  if (daysUntil < 0) {
    return {
      label: `${Math.abs(daysUntil)} days overdue`,
      color: "dark:text-red-400 text-red-700",
      borderColor: "dark:border-red-500 border-red-300",
    }
  } else if (daysUntil === 0) {
    return { label: "Due today", color: "dark:text-amber-400 text-amber-700", borderColor: "dark:border-amber-500 border-amber-300" }
  } else if (daysUntil <= 7) {
    return { label: `Due in ${daysUntil} days`, color: "dark:text-yellow-400 text-yellow-700", borderColor: "dark:border-yellow-500 border-yellow-300" }
  }
  return { label: `Due in ${daysUntil} days`, color: "dark:text-slate-400 text-slate-500", borderColor: "dark:border-slate-500 border-slate-300" }
}

function getStatusColors(status: string): { bg: string; text: string; border: string; bgLight: string; badgeBg: string; badgeText: string } {
  switch (status) {
    case "overdue":
      return {
        bg: "dark:bg-red-600 bg-red-50",
        text: "dark:text-red-200 text-red-900",
        border: "dark:border-l-red-500 border-l-red-400",
        bgLight: "dark:bg-red-950 bg-red-100",
        badgeBg: "dark:bg-red-600 bg-red-100",
        badgeText: "dark:text-red-100 text-red-900",
      }
    case "due_today":
      return {
        bg: "dark:bg-amber-600 bg-amber-50",
        text: "dark:text-amber-200 text-amber-900",
        border: "dark:border-l-amber-500 border-l-amber-400",
        bgLight: "dark:bg-amber-950 bg-amber-100",
        badgeBg: "dark:bg-amber-500 bg-amber-100",
        badgeText: "dark:text-amber-100 text-amber-900",
      }
    case "due_week":
      return {
        bg: "dark:bg-yellow-600 bg-yellow-50",
        text: "dark:text-yellow-200 text-yellow-900",
        border: "dark:border-l-yellow-500 border-l-yellow-400",
        bgLight: "dark:bg-yellow-950 bg-yellow-100",
        badgeBg: "dark:bg-yellow-500 bg-yellow-100",
        badgeText: "dark:text-yellow-100 text-yellow-900",
      }
    case "upcoming":
      return {
        bg: "dark:bg-blue-600 bg-blue-50",
        text: "dark:text-blue-200 text-blue-900",
        border: "dark:border-l-blue-500 border-l-blue-400",
        bgLight: "dark:bg-blue-950 bg-blue-100",
        badgeBg: "dark:bg-blue-600 bg-blue-100",
        badgeText: "dark:text-blue-100 text-blue-900",
      }
    case "paid":
      return {
        bg: "dark:bg-emerald-600 bg-emerald-50",
        text: "dark:text-emerald-200 text-emerald-900",
        border: "dark:border-l-emerald-500 border-l-emerald-400",
        bgLight: "dark:bg-emerald-950 bg-emerald-100",
        badgeBg: "dark:bg-emerald-600 bg-emerald-100",
        badgeText: "dark:text-emerald-100 text-emerald-900",
      }
    default:
      return {
        bg: "dark:bg-slate-600 bg-slate-50",
        text: "dark:text-slate-200 text-slate-900",
        border: "dark:border-l-slate-500 border-l-slate-400",
        bgLight: "dark:bg-slate-950 bg-slate-100",
        badgeBg: "dark:bg-slate-600 bg-slate-100",
        badgeText: "dark:text-slate-100 text-slate-900",
      }
  }
}

export default function RemindersPage() {
  const [selectedTenants, setSelectedTenants] = useState<number[]>([])
  const [messageType, setMessageType] = useState<"friendly" | "firm" | "final" | "custom">("friendly")
  const [customMessage, setCustomMessage] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [floorFilter, setFloorFilter] = useState<FloorFilterType>("all")
  const [sortBy, setSortBy] = useState<SortType>("urgency")
  const [searchTerm, setSearchTerm] = useState("")
  const [showPreview, setShowPreview] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [schedule, setSchedule] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState("")
  const [sentLog, setSentLog] = useState<Array<{ id: number; tenant: string; template: string; time: Date }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredAndSortedTenants = useMemo(() => {
    let filtered = mockTenants.filter((t) => {
      const matchesStatusFilter = filter === "all" || t.status === filter
      const matchesFloorFilter = floorFilter === "all" || t.floor === floorFilter
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.room.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatusFilter && matchesFloorFilter && matchesSearch
    })

    const sortOrder: Record<string, number> = {
      overdue: 0,
      due_today: 1,
      due_week: 2,
      upcoming: 3,
      paid: 4,
    }

    filtered.sort((a, b) => {
      if (sortBy === "urgency") {
        return sortOrder[a.status] - sortOrder[b.status]
      } else if (sortBy === "due_date") {
        return a.dueDate.getTime() - b.dueDate.getTime()
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "amount") {
        return b.amount - a.amount
      } else if (sortBy === "room") {
        return a.room.localeCompare(b.room)
      }
      return 0
    })

    return filtered
  }, [filter, floorFilter, sortBy, searchTerm])

  const groupedByFloor = useMemo(() => {
    const groups: Record<number, Tenant[]> = {}
    filteredAndSortedTenants.forEach((tenant) => {
      if (!groups[tenant.floor]) groups[tenant.floor] = []
      groups[tenant.floor].push(tenant)
    })
    return Object.entries(groups).map(([floor, tenants]) => ({
      floor: parseInt(floor),
      tenants,
      allPaid: tenants.every((t) => t.status === "paid"),
    }))
  }, [filteredAndSortedTenants])

  const stats = useMemo(() => {
    return {
      overdue: mockTenants.filter((t) => t.status === "overdue").length,
      due_week: mockTenants.filter((t) => t.status === "due_today" || t.status === "due_week").length,
      paid: mockTenants.filter((t) => t.status === "paid").length,
    }
  }, [])

  const indeterminateCheckbox = selectedTenants.length > 0 && selectedTenants.length < filteredAndSortedTenants.length

  const toggleTenant = (id: number) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedTenants.length === filteredAndSortedTenants.length) {
      setSelectedTenants([])
    } else {
      setSelectedTenants(filteredAndSortedTenants.map((t) => t.id))
    }
  }

  const sendReminders = () => {
    if (selectedTenants.length === 0) return

    const selectedTenantsData = mockTenants.filter((t) => selectedTenants.includes(t.id))
    selectedTenantsData.forEach((tenant) => {
      setSentLog((prev) => [
        {
          id: tenant.id,
          tenant: `${tenant.name} (${tenant.room})`,
          template: messageType === "custom" ? "Custom" : messageType,
          time: new Date(),
        },
        ...prev.slice(0, 4),
      ])
    })

    setSelectedTenants([])
  }

  const markAsPaid = (tenantId: number) => {
    setMarkingPaid(null)
    // In a real app, this would update the database
  }

  const insertToken = (token: string) => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const text = customMessage
    const newText = text.substring(0, start) + token + text.substring(end)
    setCustomMessage(newText)
  }

  const getMessage = (tenant: Tenant) => {
    const template = messageType === "custom" ? customMessage : messageTemplates[messageType]
    return template
      .replace("{name}", tenant.name.split(" ")[0])
      .replace("{amount}", `₹${tenant.amount.toLocaleString()}`)
      .replace("{room}", tenant.room)
      .replace("{dueDate}", tenant.dueDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" }))
  }

  const selectedTenantsData = mockTenants.filter((t) => selectedTenants.includes(t.id))
  const isAnyFilterActive = filter !== "all" || floorFilter !== "all" || searchTerm !== "" || sortBy !== "urgency"

  return (
    <DashboardLayout title="Reminders">
      <div className="h-[calc(100vh-100px)] flex gap-4 dark:bg-slate-900/50">
        {/* Left Panel: Tenant List (65%) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Quick Filter Pills */}
          <div className="mb-5">
            <h1 className="text-3xl font-bold mb-4">Reminders</h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("overdue")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "overdue"
                    ? "dark:bg-red-600 dark:border-red-500 dark:text-white bg-red-100 border-red-300 text-red-900"
                    : "dark:border-red-500/30 dark:bg-transparent dark:text-red-400 border-red-200 bg-transparent text-red-700 dark:hover:bg-red-600/20 hover:bg-red-50"
                )}
              >
                {stats.overdue} overdue
              </button>
              <button
                onClick={() => setFilter("due_week")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "due_week"
                    ? "dark:bg-yellow-500 dark:border-yellow-400 dark:text-white bg-yellow-100 border-yellow-300 text-yellow-900"
                    : "dark:border-yellow-500/30 dark:bg-transparent dark:text-yellow-400 border-yellow-200 bg-transparent text-yellow-700 dark:hover:bg-yellow-600/20 hover:bg-yellow-50"
                )}
              >
                {stats.due_week} this week
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "paid"
                    ? "dark:bg-emerald-600 dark:border-emerald-500 dark:text-white bg-emerald-100 border-emerald-300 text-emerald-900"
                    : "dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-400 border-emerald-200 bg-transparent text-emerald-700 dark:hover:bg-emerald-600/20 hover:bg-emerald-50"
                )}
              >
                {stats.paid} paid
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-4 space-y-3">
            {/* Search Row */}
            <div className="flex gap-2 items-center">
              {/* Master Checkbox */}
              <Checkbox
                checked={selectedTenants.length === filteredAndSortedTenants.length && filteredAndSortedTenants.length > 0}
                onCheckedChange={selectAll}
                ref={(el) => {
                  if (el && indeterminateCheckbox) {
                    (el as any).indeterminate = true
                  }
                }}
                className="shrink-0"
                aria-label="Select all visible tenants"
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 dark:text-slate-500 text-slate-400" />
                <Input
                  placeholder="Search by name or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200"
                />
              </div>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors"
                title="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4 dark:text-slate-400 text-slate-600" />
              </button>
            </div>

            {showShortcuts && (
              <div className="p-3 dark:bg-slate-800 dark:border-slate-700 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <p className="font-semibold mb-2 dark:text-slate-200 text-slate-900">Keyboard shortcuts:</p>
                <p><kbd className="dark:bg-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-xs">Space</kbd> Select/deselect tenant</p>
                <p><kbd className="dark:bg-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-xs">Ctrl+A</kbd> Select all visible</p>
                <p><kbd className="dark:bg-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-xs">Ctrl+Enter</kbd> Send reminders</p>
                <p><kbd className="dark:bg-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-xs">Esc</kbd> Deselect all</p>
              </div>
            )}

            {/* Dropdowns Row */}
            <div className="flex gap-2 items-center justify-between flex-wrap">
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                  <SelectTrigger className="w-[110px] text-sm dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due_today">Due Today</SelectItem>
                    <SelectItem value="due_week">This Week</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={floorFilter.toString()} onValueChange={(value) => setFloorFilter(value === "all" ? "all" : parseInt(value) as 1 | 2)}>
                  <SelectTrigger className="w-[110px] text-sm dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    <SelectItem value="1">Floor 1</SelectItem>
                    <SelectItem value="2">Floor 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                  <SelectTrigger className="w-[110px] text-sm dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgency">By Urgency</SelectItem>
                    <SelectItem value="due_date">By Due Date</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="amount">By Amount</SelectItem>
                    <SelectItem value="room">By Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 items-center">
                {isAnyFilterActive && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setFilter("all")
                      setFloorFilter("all")
                      setSortBy("urgency")
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Clear filters
                  </button>
                )}
                <div className="text-xs dark:text-slate-400 text-slate-600 font-medium">
                  {filteredAndSortedTenants.length} tenant{filteredAndSortedTenants.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedTenants.length > 0 && (
            <div className="mb-4 p-3 dark:bg-blue-950/40 dark:border-blue-500/30 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
              <div className="text-sm font-medium">
                <strong>{selectedTenants.length}</strong> tenant{selectedTenants.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => selectAll()}
                  className="dark:text-blue-400 text-blue-600 hover:underline font-medium"
                >
                  Select all ({filteredAndSortedTenants.length})
                </button>
                <button
                  onClick={() => setSelectedTenants([])}
                  className="dark:text-blue-400 text-blue-600 hover:underline font-medium"
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}

          {/* Tenant List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 pb-2">
            {filteredAndSortedTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-12 w-12 dark:text-slate-500 text-slate-400 mb-3 opacity-50" />
                <p className="text-lg font-semibold dark:text-slate-200 text-slate-900 mb-1">All clear!</p>
                <p className="text-sm dark:text-slate-400 text-slate-600">No tenants match your filters.</p>
                {isAnyFilterActive && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setFilter("all")
                      setFloorFilter("all")
                      setSortBy("urgency")
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-3 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {groupedByFloor.map((group) => (
                  <div key={group.floor}>
                    {/* Floor Header */}
                    <div className="sticky top-0 dark:bg-slate-900/95 bg-slate-50/95 backdrop-blur-sm px-3 py-2 border-b dark:border-slate-700 border-slate-200 -mx-2 mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold dark:text-slate-400 text-slate-600 uppercase tracking-wider">
                        Floor {group.floor} — {group.tenants.length} tenant{group.tenants.length !== 1 ? "s" : ""}
                        {group.allPaid && <span className="text-emerald-600 dark:text-emerald-400 ml-2">✓ all paid</span>}
                      </p>
                    </div>

                    {/* Tenant Cards */}
                    {group.tenants.map((tenant) => {
                      const isSelected = selectedTenants.includes(tenant.id)
                      const { label: dueLabel, color: dueColor, borderColor } = getRelativeDueDate(tenant.dueDate)
                      const colors = getStatusColors(tenant.status)

                      return (
                        <div key={tenant.id}>
                          {markingPaid === tenant.id && (
                            <div className="mb-2 p-3 dark:bg-amber-950/40 dark:border-amber-500/30 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                              <p className="text-sm dark:text-amber-200 text-amber-900">
                                Mark <strong>{tenant.name}</strong> as paid for this month?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setMarkingPaid(null)}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs dark:bg-emerald-600 dark:hover:bg-emerald-700 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => markAsPaid(tenant.id)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 transition-all cursor-pointer group",
                              "dark:border-slate-700 border-slate-200 dark:hover:bg-slate-800/60 hover:bg-slate-100/60",
                              isSelected && `${colors.bgLight} dark:border-l-blue-500 border-l-blue-400`,
                              !isSelected && `${colors.bg} ${colors.border}`,
                              tenant.status === "paid" && "opacity-70"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTenant(tenant.id)}
                              className="shrink-0"
                              disabled={tenant.status === "paid"}
                            />

                            {/* Avatar */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-full dark:bg-slate-700 bg-slate-200 text-xs font-bold shrink-0 dark:text-slate-100 text-slate-900">
                              {tenant.name.split(" ").map((n) => n[0]).join("")}
                            </div>

                            {/* Name & Room */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm dark:text-slate-100 text-slate-900">{tenant.name}</p>
                              <p className="text-xs dark:text-slate-400 text-slate-600">Room {tenant.room}</p>
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col items-end gap-0.5">
                              <p className={cn("text-xs font-bold", dueColor)}>{dueLabel}</p>
                              <p className="text-xs dark:text-slate-400 text-slate-600">
                                {tenant.dueDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </p>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0 min-w-[75px]">
                              <p className="font-bold text-sm dark:text-slate-100 text-slate-900">₹{tenant.amount.toLocaleString()}</p>
                            </div>

                            {/* Status Badge */}
                            <Badge className={cn("shrink-0 text-xs font-semibold", colors.badgeBg, colors.badgeText)}>
                              {tenant.status === "due_today"
                                ? "Due Today"
                                : tenant.status === "due_week"
                                ? "This Week"
                                : tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1).replace("_", " ")}
                            </Badge>

                            {/* Hover Actions */}
                            {tenant.status !== "paid" && (
                              <div className="hidden group-hover:flex gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedTenants([tenant.id])
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-medium dark:bg-green-600 dark:hover:bg-green-700 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1.5 transition-colors"
                                  title="Send reminder to this tenant"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Send reminder
                                </button>
                                <button
                                  onClick={() => setMarkingPaid(tenant.id)}
                                  className="px-2.5 py-1.5 text-xs font-medium dark:bg-blue-600 dark:hover:bg-blue-700 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1.5 transition-colors"
                                  title="Mark as paid this month"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Mark paid
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: WhatsApp Composer (35%, Sticky) */}
        <div className="w-[35%] flex flex-col dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200 border rounded-lg overflow-hidden sticky top-0 h-[calc(100vh-100px)]">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 dark:border-slate-700 border-slate-200 border-b dark:bg-slate-900 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <h2 className="font-bold text-lg dark:text-slate-100 text-slate-900">WhatsApp Reminder</h2>
              </div>
              {selectedTenants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs dark:text-slate-400 text-slate-600">Sending to {selectedTenants.length}:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTenantsData.slice(0, 3).map((tenant) => (
                      <div key={tenant.id} className="relative">
                        <div className="h-6 w-6 rounded-full dark:bg-slate-700 bg-slate-200 flex items-center justify-center text-xs font-bold dark:text-slate-100 text-slate-900">
                          {tenant.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      </div>
                    ))}
                    {selectedTenants.length > 3 && (
                      <span className="text-xs dark:text-slate-400 text-slate-600 font-medium">+{selectedTenants.length - 3} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs dark:text-slate-400 text-slate-600">No tenants selected</p>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Selected Recipients Pills */}
              {selectedTenants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase">Recipients</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTenantsData.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center gap-1.5 dark:bg-slate-700 dark:border-slate-600 bg-slate-100 border border-slate-200 rounded-full pl-2.5 pr-1.5 py-1 text-xs"
                      >
                        <span className="font-medium dark:text-slate-100 text-slate-900">{tenant.name}</span>
                        <button
                          onClick={() => toggleTenant(tenant.id)}
                          className="p-0.5 dark:hover:bg-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                          title="Remove from selection"
                        >
                          <X className="h-3 w-3 dark:text-slate-300 text-slate-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase dark:text-slate-300 text-slate-700">Template</Label>
                <Select
                  value={messageType}
                  onValueChange={(value: "friendly" | "firm" | "final" | "custom") => setMessageType(value)}
                >
                  <SelectTrigger className="text-sm dark:bg-slate-700 dark:border-slate-600 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">
                      <div className="flex items-center gap-2">
                        <SmileIcon className="h-4 w-4" />
                        Friendly Reminder
                      </div>
                    </SelectItem>
                    <SelectItem value="firm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Firm Notice
                      </div>
                    </SelectItem>
                    <SelectItem value="final">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4" />
                        Final Warning
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">Custom message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Composer */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase dark:text-slate-300 text-slate-700">Message</Label>
                {messageType === "custom" ? (
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message. Use {name}, {amount}, {room}, {dueDate}"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[100px] resize-none text-xs dark:bg-slate-700 dark:border-slate-600 bg-slate-50 border-slate-200"
                  />
                ) : (
                  <Textarea
                    value={getMessage(selectedTenantsData[0] || mockTenants[0])}
                    readOnly
                    className="min-h-[100px] resize-none text-xs dark:bg-slate-700 dark:border-slate-600 bg-slate-50 border-slate-200 opacity-75"
                  />
                )}
              </div>

              {/* Placeholder Tokens */}
              {messageType === "custom" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase dark:text-slate-300 text-slate-700">Insert token:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { code: "{name}", label: "name" },
                      { code: "{amount}", label: "amount" },
                      { code: "{room}", label: "room" },
                      { code: "{dueDate}", label: "dueDate" },
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => insertToken(item.code)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono dark:bg-slate-700 dark:border-slate-600 dark:text-blue-300 dark:hover:border-blue-500 bg-slate-100 border border-slate-300 text-blue-700 hover:border-blue-400 rounded transition-colors"
                        title={`Insert ${item.label} token`}
                      >
                        <Plus className="h-3 w-3" />
                        {item.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview */}
              {showPreview && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between p-2"
                  >
                    <span className="uppercase font-semibold">Preview</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showPreview && "rotate-180")} />
                  </button>

                  {selectedTenantsData.length > 0 ? (
                    <div className="dark:bg-emerald-950/40 dark:border-emerald-900/50 bg-emerald-50 border border-emerald-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold dark:text-emerald-400 text-emerald-700 mb-2">
                        Preview for {selectedTenantsData[0].name}:
                      </p>
                      <div className="dark:bg-emerald-700/60 bg-green-200 rounded-2xl rounded-tr-none p-3 text-xs dark:text-white text-slate-900 leading-relaxed text-right max-w-xs ml-auto">
                        {getMessage(selectedTenantsData[0])}
                      </div>
                      <div className="text-right">
                        <Check className="h-3 w-3 dark:text-emerald-400 text-emerald-700 inline ml-1" />
                      </div>
                      <p className="text-xs dark:text-slate-400 text-slate-600 text-center mt-2">
                        Uses first selected tenant&apos;s data
                      </p>
                    </div>
                  ) : (
                    <div className="dark:bg-slate-700/50 bg-slate-100 rounded p-3 text-xs dark:text-slate-400 text-slate-600 text-center">
                      Select tenants to preview message
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 dark:bg-slate-700 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium dark:text-slate-200 text-slate-900">When to send?</span>
                  <button
                    onClick={() => setSchedule(!schedule)}
                    className={cn(
                      "relative h-5 w-10 rounded-full transition-colors",
                      schedule ? "dark:bg-blue-600 bg-blue-600" : "dark:bg-slate-600 bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full bg-white absolute top-0.5 transition-transform",
                      schedule ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                {schedule && (
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="text-xs dark:bg-slate-700 dark:border-slate-600 bg-slate-50 border-slate-200"
                  />
                )}
              </div>
            </div>

            {/* Send Button */}
            <div className="p-4 dark:border-slate-700 dark:bg-slate-900 border-slate-200 bg-slate-50 border-t space-y-2">
              <Button
                className={cn(
                  "w-full transition-all",
                  selectedTenants.length === 0
                    ? "dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 bg-slate-300 text-slate-600 hover:bg-slate-300 cursor-not-allowed opacity-50"
                    : "dark:bg-emerald-600 dark:hover:bg-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                disabled={selectedTenants.length === 0}
                onClick={sendReminders}
              >
                <Send className="mr-2 h-4 w-4" />
                {selectedTenants.length === 0 ? "Select tenants to send" : `Send to ${selectedTenants.length} →`}
              </Button>
              <p className="text-xs dark:text-slate-400 text-slate-600 text-center">
                Messages will open in WhatsApp Web
              </p>
            </div>

            {/* Recent Activity */}
            {sentLog.length > 0 && (
              <div className="dark:border-slate-700 border-slate-200 border-t">
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="w-full p-3 dark:hover:bg-slate-900 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 dark:text-slate-400 text-slate-600" />
                    <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">Recent Activity</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform dark:text-slate-400 text-slate-600", showActivity && "rotate-180")} />
                </button>

                {showActivity && (
                  <div className="p-3 dark:bg-slate-900 bg-slate-50 max-h-[240px] overflow-y-auto space-y-2 dark:border-t dark:border-slate-700 border-t border-slate-200">
                    {sentLog.map((log, idx) => (
                      <div key={idx} className="text-xs dark:border-slate-700 dark:text-slate-300 border-slate-200 text-slate-700 border-l dark:pl-3 pl-3 py-1.5">
                        <p className="font-medium">{log.tenant}</p>
                        <p className="dark:text-slate-400 text-slate-600 text-xs">
                          {log.template === "custom" ? "Custom" : log.template} template · {log.time.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
