"use client"

import { useState, useMemo } from "react"
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
import { MessageCircle, Send, AlertCircle, Search, Clock, ChevronDown, X, MessageSquare, DollarSign } from "lucide-react"
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

function getRelativeDueDate(dueDate: Date): { label: string; color: string } {
  const now = new Date()
  const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  if (daysUntil < 0) {
    return {
      label: `${Math.abs(daysUntil)} days overdue`,
      color: "text-red-500",
    }
  } else if (daysUntil === 0) {
    return { label: "Due today", color: "text-amber-500" }
  } else if (daysUntil <= 7) {
    return { label: `Due in ${daysUntil} days`, color: "text-yellow-500" }
  }
  return { label: `Due in ${daysUntil} days`, color: "text-gray-400" }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case "overdue":
      return "bg-red-600"
    case "due_today":
      return "bg-amber-500"
    case "due_week":
      return "bg-yellow-500"
    case "upcoming":
      return "bg-blue-500"
    case "paid":
      return "bg-emerald-500"
    default:
      return "bg-gray-500"
  }
}

export default function RemindersPage() {
  const [selectedTenants, setSelectedTenants] = useState<number[]>([])
  const [messageType, setMessageType] = useState<"friendly" | "firm" | "final" | "custom">("friendly")
  const [customMessage, setCustomMessage] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortType>("urgency")
  const [searchTerm, setSearchTerm] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [schedule, setSchedule] = useState(false)
  const [sentLog, setSentLog] = useState<Array<{ id: number; tenant: string; template: string; time: Date }>>([])

  const filteredAndSortedTenants = useMemo(() => {
    let filtered = mockTenants.filter((t) => {
      const matchesFilter = filter === "all" || t.status === filter
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.room.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
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
  }, [filter, sortBy, searchTerm])

  const stats = useMemo(() => {
    return {
      overdue: mockTenants.filter((t) => t.status === "overdue").length,
      due_week: mockTenants.filter((t) => t.status === "due_today" || t.status === "due_week").length,
      paid: mockTenants.filter((t) => t.status === "paid").length,
    }
  }, [])

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
        ...prev.slice(-4),
        {
          id: tenant.id,
          tenant: `${tenant.name} (${tenant.room})`,
          template: messageType === "custom" ? "Custom" : messageType,
          time: new Date(),
        },
      ])
    })

    setSelectedTenants([])
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
  const relativeDue = getRelativeDueDate(mockTenants[0]?.dueDate || new Date())

  return (
    <DashboardLayout title="Reminders">
      <div className="h-[calc(100vh-100px)] flex gap-6">
        {/* Left Panel: Tenant List (65%) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Summary Badges */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-3">Reminders</h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("overdue")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                  filter === "overdue"
                    ? "bg-red-600 text-white"
                    : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                )}
              >
                {stats.overdue} overdue
              </button>
              <button
                onClick={() => setFilter("due_week")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                  filter === "due_week"
                    ? "bg-yellow-500 text-white"
                    : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                )}
              >
                {stats.due_week} due this week
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                  filter === "paid"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                )}
              >
                {stats.paid} paid
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenant name or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>

            {/* Dropdowns and Tenant Count */}
            <div className="flex gap-2 items-center justify-between flex-wrap">
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                  <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due_today">Due Today</SelectItem>
                    <SelectItem value="due_week">Due This Week</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                  <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700">
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

              {(searchTerm || filter !== "all" || sortBy !== "urgency") && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setFilter("all")
                    setSortBy("urgency")
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Clear filters
                </button>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                {filteredAndSortedTenants.length} tenants
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedTenants.length > 0 && (
            <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-between">
              <div className="text-sm">
                <strong>{selectedTenants.length} tenants selected</strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectAll()}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Tenant List */}
          <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg bg-slate-900/50">
            {filteredAndSortedTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-lg font-semibold mb-1">All clear!</p>
                <p className="text-sm text-muted-foreground">No tenants match your current filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setFilter("all")
                    setSortBy("urgency")
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-3 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredAndSortedTenants.map((tenant) => {
                  const isSelected = selectedTenants.includes(tenant.id)
                  const { label: dueLabel, color: dueColor } = getRelativeDueDate(tenant.dueDate)
                  const statusDotColor = getStatusDotColor(tenant.status)

                  return (
                    <div
                      key={tenant.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer group",
                        isSelected && "bg-blue-600/20 border-l-4 border-blue-500",
                        tenant.status === "paid" && "opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTenant(tenant.id)}
                        className="shrink-0"
                      />

                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                          {tenant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900", statusDotColor)} />
                      </div>

                      {/* Name & Room */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">Room {tenant.room}</p>
                      </div>

                      {/* Due Date */}
                      <div className="flex flex-col items-end gap-0.5">
                        <p className={cn("text-xs font-semibold", dueColor)}>{dueLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.dueDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="font-semibold text-sm">₹{tenant.amount.toLocaleString()}</p>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        className={cn(
                          "shrink-0",
                          tenant.status === "overdue" && "bg-red-600 text-white",
                          tenant.status === "due_today" && "bg-amber-500 text-white",
                          tenant.status === "due_week" && "bg-yellow-500 text-white",
                          tenant.status === "upcoming" && "bg-blue-600 text-white",
                          tenant.status === "paid" && "bg-emerald-600 text-white"
                        )}
                      >
                        {tenant.status === "due_today"
                          ? "Due Today"
                          : tenant.status === "due_week"
                          ? "This Week"
                          : tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1).replace("_", " ")}
                      </Badge>

                      {/* Hover Actions */}
                      <div className="hidden group-hover:flex gap-1">
                        <button className="p-1.5 hover:bg-slate-700 rounded transition-colors">
                          <MessageSquare className="h-4 w-4 text-green-400" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-700 rounded transition-colors">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: WhatsApp Composer (35%, Sticky) */}
        <div className="w-[35%] flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden sticky top-0 h-[calc(100vh-100px)]">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-950">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <h2 className="font-bold text-lg">WhatsApp Reminder</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTenants.length > 0
                  ? `Ready to send to ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? "s" : ""}`
                  : "Select tenants from the list"}
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Recipient Summary */}
              {selectedTenants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">RECIPIENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTenantsData.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center gap-1 bg-slate-800 rounded-full pl-2 pr-1 py-1"
                      >
                        <span className="text-xs font-medium">{tenant.name}</span>
                        <button
                          onClick={() => toggleTenant(tenant.id)}
                          className="p-0.5 hover:bg-slate-700 rounded-full transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Select tenants from the list</p>
                </div>
              )}

              {/* Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">TEMPLATE</Label>
                <Select
                  value={messageType}
                  onValueChange={(value: "friendly" | "firm" | "final" | "custom") => setMessageType(value)}
                >
                  <SelectTrigger className="text-sm bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly Reminder</SelectItem>
                    <SelectItem value="firm">Firm Notice</SelectItem>
                    <SelectItem value="final">Final Warning</SelectItem>
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Composer */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">MESSAGE</Label>
                {messageType === "custom" ? (
                  <Textarea
                    placeholder="Type your message. Use {name}, {amount}, {room}, {dueDate}"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[100px] resize-none text-xs bg-slate-800 border-slate-700"
                  />
                ) : (
                  <Textarea
                    value={getMessage(selectedTenantsData[0] || mockTenants[0])}
                    readOnly
                    className="min-h-[100px] resize-none text-xs bg-slate-800 border-slate-700 opacity-75"
                  />
                )}
              </div>

              {/* Placeholder Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">PLACEHOLDERS</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: "{name}", color: "bg-blue-600" },
                    { code: "{amount}", color: "bg-emerald-600" },
                    { code: "{room}", color: "bg-purple-600" },
                    { code: "{dueDate}", color: "bg-amber-600" },
                  ].map((item) => (
                    <button
                      key={item.code}
                      className={cn("text-xs px-2 py-1.5 rounded text-white font-mono cursor-pointer hover:opacity-90 transition-opacity", item.color)}
                      onClick={() => {
                        if (messageType === "custom") {
                          setCustomMessage((prev) => prev + " " + item.code)
                        }
                      }}
                    >
                      {item.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-between p-2 hover:bg-slate-800 rounded transition-colors"
              >
                <span>Preview</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showPreview && "rotate-180")} />
              </button>

              {/* Live Preview */}
              {showPreview && selectedTenantsData.length > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 mb-2">Message bubble preview for {selectedTenantsData[0].name}:</p>
                  <div className="bg-emerald-700/40 rounded p-3 text-xs text-white leading-relaxed text-right">
                    {getMessage(selectedTenantsData[0])}
                  </div>
                </div>
              )}

              {/* Schedule Toggle */}
              <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
                <span className="text-xs font-medium">Send Now</span>
                <button
                  onClick={() => setSchedule(!schedule)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    schedule ? "bg-blue-600" : "bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full bg-white absolute top-0.5 transition-transform",
                    schedule ? "translate-x-4.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {schedule && (
                <Input
                  type="datetime-local"
                  className="text-xs bg-slate-800 border-slate-700"
                />
              )}
            </div>

            {/* Send Button */}
            <div className="p-4 border-t border-slate-700 bg-slate-950 space-y-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={selectedTenants.length === 0}
                onClick={sendReminders}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to {selectedTenants.length}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Messages will open in WhatsApp Web for each tenant
              </p>
            </div>

            {/* Recent Activity */}
            {sentLog.length > 0 && (
              <div className="p-4 border-t border-slate-700 bg-slate-950 max-h-[200px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold">Recent Activity</p>
                </div>
                <div className="space-y-2">
                  {sentLog
                    .slice()
                    .reverse()
                    .map((log, idx) => (
                      <div key={idx} className="text-xs border-l border-slate-700 pl-3 py-1">
                        <p className="font-medium">{log.tenant}</p>
                        <p className="text-muted-foreground">
                          {log.template} template • {log.time.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
