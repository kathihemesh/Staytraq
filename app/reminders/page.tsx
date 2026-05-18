"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { MessageCircle, Send, AlertCircle, Clock, CheckCircle2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"

interface Tenant {
  id: number
  name: string
  phone: string
  room_number: string
  reminder_status: "upcoming" | "due_today" | "overdue" | "paid"
  amount: number
  due_date: string
  last_reminder_sent: string | null
}

type FilterType = "all" | "due_today" | "upcoming" | "overdue" | "paid"
type SortType = "urgency" | "due_date" | "amount"

const messageTemplates = {
  friendly: `Hi {name}, this is a friendly reminder that your rent of ₹{amount} for Room {room} is due on the {dueDate}. Please make the payment at your earliest convenience. Thank you!`,
  strict: `Dear {name}, your rent payment of ₹{amount} for Room {room} is now overdue. Please clear the dues immediately to avoid any inconvenience. Contact us if you have any issues.`,
  custom: "",
}

export default function RemindersPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenants, setSelectedTenants] = useState<number[]>([])
  const [messageType, setMessageType] = useState<"friendly" | "strict" | "custom">("friendly")
  const [customMessage, setCustomMessage] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortType>("urgency")
  const [searchTerm, setSearchTerm] = useState("")
  const [sentReminders, setSentReminders] = useState<number[]>([])

  // Initialize Supabase client
  useEffect(() => {
    const fetchTenants = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Missing Supabase credentials")
        setLoading(false)
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data, error } = await supabase
        .from("tenants_table")
        .select("id, name, phone, room_number, reminder_status, amount, due_date, last_reminder_sent")

      if (error) {
        console.error("[v0] Error fetching tenants:", error)
        setLoading(false)
        return
      }

      if (data) {
        setTenants(data as Tenant[])
      }
      setLoading(false)
    }

    fetchTenants()
  }, [])

  // Smart filtering and sorting
  const filteredAndSortedTenants = useMemo(() => {
    let filtered = tenants.filter((t) => {
      const matchesFilter = filter === "all" || t.reminder_status === filter
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.room_number.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })

    // Sort by urgency
    const sortOrder: Record<string, number> = {
      overdue: 0,
      due_today: 1,
      upcoming: 2,
      paid: 3,
    }

    filtered.sort((a, b) => {
      if (sortBy === "urgency") {
        return sortOrder[a.reminder_status] - sortOrder[b.reminder_status]
      } else if (sortBy === "due_date") {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      } else if (sortBy === "amount") {
        return b.amount - a.amount
      }
      return 0
    })

    return filtered
  }, [tenants, filter, sortBy, searchTerm])

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

    // Simulate sending reminders
    setSentReminders((prev) => [...prev, ...selectedTenants])
    setSelectedTenants([])
  }

  const getMessage = (tenant: Tenant) => {
    const template = messageType === "custom" ? customMessage : messageTemplates[messageType]
    return template
      .replace("{name}", tenant.name.split(" ")[0])
      .replace("{amount}", tenant.amount.toLocaleString())
      .replace("{room}", tenant.room_number)
      .replace("{dueDate}", new Date(tenant.due_date).toLocaleDateString())
  }

  // Smart summary stats
  const stats = useMemo(() => {
    return {
      toSendToday: tenants.filter((t) => t.reminder_status === "due_today").length,
      upcoming: tenants.filter((t) => t.reminder_status === "upcoming").length,
      overdue: tenants.filter((t) => t.reminder_status === "overdue").length,
      recentlySent: tenants.filter((t) => t.last_reminder_sent !== null).length,
    }
  }, [tenants])

  if (loading) {
    return (
      <DashboardLayout title="Reminders">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reminders">
      <div className="space-y-6">
        {/* Smart Summary Section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={cn(
            "transition-all",
            stats.toSendToday > 0 && "ring-2 ring-warning/50 bg-warning/5"
          )}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Today</p>
                <p className="text-2xl font-bold">{stats.toSendToday}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Next 5 Days</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "transition-all",
            stats.overdue > 0 && "ring-2 ring-destructive/50 bg-destructive/5"
          )}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Recently Sent</p>
                <p className="text-2xl font-bold">{stats.recentlySent}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tenant List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div>
                  <CardTitle>Tenant Reminders</CardTitle>
                  <CardDescription>
                    {selectedTenants.length > 0 
                      ? `${selectedTenants.length} selected · ${filteredAndSortedTenants.length} matching`
                      : `${filteredAndSortedTenants.length} tenants to manage`
                    }
                  </CardDescription>
                </div>

                {/* Controls */}
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or room..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters and Sorting */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="due_today">Due Today</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgency">By Urgency</SelectItem>
                          <SelectItem value="due_date">By Due Date</SelectItem>
                          <SelectItem value="amount">By Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" size="sm" onClick={selectAll}>
                      {selectedTenants.length === filteredAndSortedTenants.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredAndSortedTenants.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p>No tenants found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAndSortedTenants.map((tenant) => {
                      const isSelected = selectedTenants.includes(tenant.id)
                      const wasSent = sentReminders.includes(tenant.id)

                      return (
                        <div
                          key={tenant.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-4 transition-colors sm:items-center sm:gap-4 sm:px-6",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTenant(tenant.id)}
                            disabled={wasSent}
                            className="mt-1 sm:mt-0"
                          />
                          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                                {tenant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Room {tenant.room_number} {tenant.phone && `• ${tenant.phone}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:gap-4">
                              <div className="text-right">
                                <p className="font-semibold text-sm">
                                  ₹{tenant.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tenant.due_date).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>

                              {wasSent ? (
                                <Badge className="bg-success/20 text-success border-0">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Sent
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    tenant.reminder_status === "overdue"
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : tenant.reminder_status === "due_today"
                                      ? "bg-warning/10 text-warning border-warning/30"
                                      : tenant.reminder_status === "upcoming"
                                      ? "bg-primary/10 text-primary border-primary/30"
                                      : "bg-success/10 text-success border-success/30"
                                  )}
                                >
                                  {tenant.reminder_status === "due_today"
                                    ? "Due Today"
                                    : tenant.reminder_status === "overdue"
                                    ? "Overdue"
                                    : tenant.reminder_status === "upcoming"
                                    ? "Upcoming"
                                    : "Paid"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Composer Panel */}
          <div>
            <Card className="lg:sticky lg:top-24">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-success" />
                  WhatsApp Message
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedTenants.length > 0
                    ? `Ready to send to ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? "s" : ""}`
                    : "Select tenants to send"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Template</Label>
                  <Select
                    value={messageType}
                    onValueChange={(value: "friendly" | "strict" | "custom") =>
                      setMessageType(value)
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly Reminder</SelectItem>
                      <SelectItem value="strict">Strict Notice</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Preview</Label>
                  {messageType === "custom" ? (
                    <Textarea
                      placeholder="Type your message. Use {name}, {amount}, {room}, {dueDate}"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="min-h-[120px] resize-none text-xs"
                    />
                  ) : (
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                      {filteredAndSortedTenants[0]
                        ? getMessage(filteredAndSortedTenants[0])
                        : "Select a tenant to preview"}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Placeholders
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["{name}", "{amount}", "{room}", "{dueDate}"].map((tag) => (
                      <code
                        key={tag}
                        className="rounded bg-background px-2 py-1 text-xs font-mono border"
                      >
                        {tag}
                      </code>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={selectedTenants.length === 0}
                  onClick={sendReminders}
                  size="sm"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedTenants.length}
                </Button>

                {selectedTenants.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Select tenants above to send reminders
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
