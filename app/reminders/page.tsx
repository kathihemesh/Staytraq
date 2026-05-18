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
      <div className="min-h-[calc(100vh-100px)] flex flex-col lg:flex-row lg:gap-4 gap-0 overflow-x-hidden">
        {/* Left Panel: Tenant List */}
        <div className="flex-1 flex flex-col overflow-hidden lg:h-[calc(100vh-100px)]">
          {/* Header with Quick Filter Pills */}
          <div className="mb-5">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4">Reminders</h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("overdue")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "overdue"
                    ? "bg-red-100 border-red-300 text-red-900 dark:bg-transparent dark:border-red-500 dark:text-red-400"
                    : "bg-transparent border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                )}
              >
                {stats.overdue} overdue
              </button>
              <button
                onClick={() => setFilter("due_week")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "due_week"
                    ? "bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-transparent dark:border-yellow-500 dark:text-yellow-400"
                    : "bg-transparent border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-500/30 dark:bg-transparent dark:text-yellow-400 dark:hover:bg-yellow-500/10"
                )}
              >
                {stats.due_week} this week
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                  filter === "paid"
                    ? "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-transparent dark:border-emerald-500 dark:text-emerald-400"
                    : "bg-transparent border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                )}
              >
                {stats.paid} paid
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-4 space-y-3">
            {/* Search Row */}
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search by name or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Dropdowns Row */}
            <div className="grid grid-cols-2 lg:flex lg:gap-2 gap-2 items-center">
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due_today">Due Today</SelectItem>
                  <SelectItem value="due_week">This Week</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={floorFilter.toString()} onValueChange={(value) => setFloorFilter(value === "all" ? "all" : parseInt(value) as 1 | 2)}>
                <SelectTrigger className="text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                <SelectTrigger className="text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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

              <div className="col-span-2 lg:col-span-1 flex gap-3 items-center justify-between lg:justify-end">
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
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                  {filteredAndSortedTenants.length} tenant{filteredAndSortedTenants.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedTenants.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-800/50 border-b-2 border-blue-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                <strong>{selectedTenants.length}</strong> tenant{selectedTenants.length !== 1 ? "s" : ""} selected
              </div>
              <button
                onClick={() => setSelectedTenants([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium text-left sm:text-right"
              >
                Deselect all
              </button>
            </div>
          )}

          {/* Tenant List Header Row */}
          {filteredAndSortedTenants.length > 0 && (
            <div className="sticky top-0 z-10 grid grid-cols-12 gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={selectedTenants.length === filteredAndSortedTenants.length && filteredAndSortedTenants.length > 0}
                  onCheckedChange={selectAll}
                  ref={(el) => {
                    if (el && indeterminateCheckbox) {
                      (el as any).indeterminate = true
                    }
                  }}
                  className="shrink-0"
                  title="Select all visible tenants"
                />
              </div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2 text-right">Due</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-4 text-right">Status</div>
            </div>
          )}

          {/* Tenant List */}
          <div className="flex-1 overflow-y-auto space-y-1 px-2">
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
                {filteredAndSortedTenants.map((tenant) => {
                  const isSelected = selectedTenants.includes(tenant.id)
                  const { label: dueLabel, color: dueColor } = getRelativeDueDate(tenant.dueDate)
                  const colors = getStatusColors(tenant.status)

                  return (
                    <div
                      key={tenant.id}
                      onClick={() => toggleTenant(tenant.id)}
                      className={cn(
                        "grid grid-cols-12 gap-3 px-4 py-2 rounded-lg border-l-4 transition-all cursor-pointer items-center",
                        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                        "hover:bg-slate-50 dark:hover:bg-slate-700/60",
                        isSelected && `${colors.bgLight} dark:border-l-blue-500 border-l-blue-500`,
                        !isSelected && colors.border,
                        tenant.status === "paid" && "opacity-60"
                      )}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(e) => e.stopPropagation?.()}
                          className="shrink-0"
                          disabled={tenant.status === "paid"}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Name & Room */}
                      <div className="col-span-4 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{tenant.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Room {tenant.room}</p>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2 text-right">
                        <p className={cn("text-xs font-bold", dueColor)}>{dueLabel}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {tenant.dueDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="col-span-1 text-right">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">₹{tenant.amount.toLocaleString()}</p>
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-4 text-right">
                        <Badge className={cn("text-xs font-semibold", "bg-red-100 text-red-900", tenant.status === "due_today" && "bg-amber-100 text-amber-900", tenant.status === "due_week" && "bg-yellow-100 text-yellow-900", tenant.status === "upcoming" && "bg-blue-100 text-blue-900", tenant.status === "paid" && "bg-emerald-100 text-emerald-900")}>
                          {tenant.status === "due_today"
                            ? "Due Today"
                            : tenant.status === "due_week"
                            ? "This Week"
                            : tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1).replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: WhatsApp Composer */}
        <div className="w-full lg:w-[35%] flex flex-col bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-lg overflow-hidden lg:sticky lg:top-0 lg:h-[calc(100vh-100px)]">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-slate-200 dark:border-slate-700 border-b bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">WhatsApp Reminder</h2>
              </div>
              {selectedTenants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sending to {selectedTenants.length}:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTenantsData.slice(0, 3).map((tenant) => (
                      <div key={tenant.id} className="relative">
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-slate-100">
                          {tenant.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      </div>
                    ))}
                    {selectedTenants.length > 3 && (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">+{selectedTenants.length - 3} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">No tenants selected</p>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Selected Recipients Pills */}
              {selectedTenants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Recipients</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTenantsData.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full pl-2.5 pr-1.5 py-1 text-xs"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">{tenant.name}</span>
                        <button
                          onClick={() => toggleTenant(tenant.id)}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                          title="Remove from selection"
                        >
                          <X className="h-3 w-3 text-slate-700 dark:text-slate-300" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Template</Label>
                <Select
                  value={messageType}
                  onValueChange={(value: "friendly" | "firm" | "final" | "custom") => setMessageType(value)}
                >
                  <SelectTrigger className="text-sm bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
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
                <Label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Message</Label>
                {messageType === "custom" ? (
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message. Use {name}, {amount}, {room}, {dueDate}"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[80px] lg:min-h-[100px] resize-none text-xs bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  />
                ) : (
                  <Textarea
                    value={getMessage(selectedTenantsData[0] || mockTenants[0])}
                    readOnly
                    className="min-h-[80px] lg:min-h-[100px] resize-none text-xs bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-75"
                  />
                )}
              </div>

              {/* Placeholder Tokens */}
              {messageType === "custom" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Insert token:</p>
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
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-500 rounded transition-colors"
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
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                        Preview for {selectedTenantsData[0].name}:
                      </p>
                      <div className="bg-green-200 dark:bg-emerald-700/60 rounded-2xl rounded-tr-none p-3 text-xs text-slate-900 dark:text-white leading-relaxed text-right max-w-xs ml-auto">
                        {getMessage(selectedTenantsData[0])}
                      </div>
                      <div className="text-right">
                        <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-400 inline ml-1" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
                        Uses first selected tenant&apos;s data
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded p-3 text-xs text-slate-600 dark:text-slate-400 text-center">
                      Select tenants to preview message
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
              <Button
                className={cn(
                  "w-full lg:h-auto h-12 transition-all",
                  selectedTenants.length === 0
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-not-allowed opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
                )}
                disabled={selectedTenants.length === 0}
                onClick={sendReminders}
              >
                <Send className="mr-2 h-4 w-4" />
                {selectedTenants.length === 0 ? "Select tenants to send" : `Send to ${selectedTenants.length} →`}
              </Button>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Messages will open in WhatsApp Web
              </p>
            </div>

            {/* Recent Activity */}
            {sentLog.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recent Activity</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-600 dark:text-slate-400", showActivity && "rotate-180")} />
                </button>

                {showActivity && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 max-h-[240px] overflow-y-auto space-y-2 border-t border-slate-200 dark:border-slate-700">
                    {sentLog.map((log, idx) => (
                      <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 border-l pl-3 py-1.5">
                        <p className="font-medium">{log.tenant}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
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
