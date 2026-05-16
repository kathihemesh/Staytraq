"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Phone, Home,
  Mail, Calendar, CreditCard, Clock, FileText, UserMinus, Download,
  Filter, ArrowUpDown, MessageSquare, AlertCircle, Users, Upload, X, Info, Eye, EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- TYPES & MOCK DATA ---

type TenantStatus = "active" | "pending_move_in" | "notice_period" | "moved_out"
type PaymentStatus = "paid" | "pending" | "late"

interface PaymentHistory {
  id: string
  month: string
  rent: number
  extraCharges: number
  status: PaymentStatus
  paidDate?: string
}

interface Tenant {
  id: string
  name: string
  avatar?: string
  phone: string
  altPhone?: string
  email?: string
  roomNumber: string
  bedNumber: string
  rentAmount: number
  extraCharges: number
  deposit: number
  dueDate: string
  moveInDate: string
  agreementDuration: string
  idType: string
  idNumber: string
  notes: string
  status: TenantStatus
  paymentHistory: PaymentHistory[]
}

const mockTenants: Tenant[] = [
  {
    id: "t1",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul.s@example.com",
    roomNumber: "101",
    bedNumber: "A",
    rentAmount: 12500,
    extraCharges: 1000,
    deposit: 25000,
    dueDate: "5th",
    moveInDate: "2023-08-01",
    agreementDuration: "11 months",
    idType: "Aadhaar",
    idNumber: "XXXX-XXXX-1234",
    notes: "Requires vegetarian meals. Parking slot #12 assigned.",
    status: "active",
    paymentHistory: [
      { id: "p1", month: "Oct 2023", rent: 12500, extraCharges: 1000, status: "paid", paidDate: "2023-10-04" },
      { id: "p2", month: "Nov 2023", rent: 12500, extraCharges: 1000, status: "paid", paidDate: "2023-11-05" },
    ]
  },
  {
    id: "t2",
    name: "Priya Patel",
    phone: "+91 98765 43211",
    roomNumber: "102",
    bedNumber: "B",
    rentAmount: 15000,
    extraCharges: 1500,
    deposit: 30000,
    dueDate: "1st",
    moveInDate: "2023-09-15",
    agreementDuration: "6 months",
    idType: "Passport",
    idNumber: "P1234567",
    notes: "",
    status: "notice_period",
    paymentHistory: [
      { id: "p3", month: "Oct 2023", rent: 15000, extraCharges: 1500, status: "paid", paidDate: "2023-10-01" },
      { id: "p4", month: "Nov 2023", rent: 15000, extraCharges: 1500, status: "pending" },
    ]
  },
  {
    id: "t3",
    name: "Amit Kumar",
    phone: "+91 98765 43212",
    roomNumber: "103",
    bedNumber: "A",
    rentAmount: 12500,
    extraCharges: 1000,
    deposit: 25000,
    dueDate: "5th",
    moveInDate: "2023-11-20",
    agreementDuration: "11 months",
    idType: "Aadhaar",
    idNumber: "XXXX-XXXX-5678",
    notes: "Moving in next week.",
    status: "pending_move_in",
    paymentHistory: []
  },
  {
    id: "t4",
    name: "Sneha Gupta",
    phone: "+91 98765 43213",
    roomNumber: "104",
    bedNumber: "C",
    rentAmount: 10000,
    extraCharges: 800,
    deposit: 20000,
    dueDate: "1st",
    moveInDate: "2022-05-01",
    agreementDuration: "12 months",
    idType: "Driving License",
    idNumber: "DL-123456",
    notes: "Moved out on 31st Oct.",
    status: "moved_out",
    paymentHistory: [
      { id: "p5", month: "Oct 2023", rent: 10000, extraCharges: 800, status: "paid", paidDate: "2023-10-02" },
    ]
  },
]

// --- COMPONENTS ---

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Selection State
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set())

  // Modals & Drawers State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [moveOutTenantId, setMoveOutTenantId] = useState<string | null>(null)
  const [viewTenantId, setViewTenantId] = useState<string | null>(null)
  
  // Sidebar Edit State (like rooms page)
  const [isEditingTenant, setIsEditingTenant] = useState(false)
  const [editTenantForm, setEditTenantForm] = useState<Partial<Tenant>>({})
  const [showIdDocument, setShowIdDocument] = useState(false)

  // Derived Values
  const activeTenant = tenants.find(t => t.id === viewTenantId) || null
  const movingOutTenant = tenants.find(t => t.id === moveOutTenantId) || null

  // New Tenant Form State (for multiple IDs)
  const [tenantIds, setTenantIds] = useState<{ type: string; fileName: string }[]>([
    { type: "aadhaar", fileName: "" }
  ])

  const addIdRow = () => {
    if (tenantIds.length < 3) {
      setTenantIds([...tenantIds, { type: "pan", fileName: "" }])
    }
  }

  const removeIdRow = (index: number) => {
    setTenantIds(tenantIds.filter((_, i) => i !== index))
  }

  const updateIdType = (index: number, type: string) => {
    const newIds = [...tenantIds]
    newIds[index].type = type
    setTenantIds(newIds)
  }

  const handleUploadId = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const newIds = [...tenantIds]
      newIds[index].fileName = file.name
      setTenantIds(newIds)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.roomNumber.includes(search) ||
      tenant.phone.includes(search)
    
    const matchesFilter = statusFilter === "all" || tenant.status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  // Handlers
  const toggleSelectAll = () => {
    if (selectedTenantIds.size === filteredTenants.length) {
      setSelectedTenantIds(new Set())
    } else {
      setSelectedTenantIds(new Set(filteredTenants.map(t => t.id)))
    }
  }

  const toggleSelectTenant = (id: string) => {
    const newSet = new Set(selectedTenantIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedTenantIds(newSet)
  }

  const handleDelete = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id))
    const newSet = new Set(selectedTenantIds)
    newSet.delete(id)
    setSelectedTenantIds(newSet)
  }

  const getStatusBadge = (status: TenantStatus) => {
    const config = {
      active: { label: "Active", className: "border-success/30 bg-success/10 text-success" },
      pending_move_in: { label: "Pending Move-In", className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
      notice_period: { label: "Notice Period", className: "border-warning/30 bg-warning/10 text-warning" },
      moved_out: { label: "Moved Out", className: "border-muted-foreground/30 bg-muted/50 text-muted-foreground" },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={cn("font-medium", className)}>{label}</Badge>
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const styles = {
      paid: "border-success/30 bg-success/10 text-success",
      pending: "border-warning/30 bg-warning/10 text-warning",
      late: "border-destructive/30 bg-destructive/10 text-destructive",
    }
    return (
      <Badge variant="outline" className={cn("font-medium text-[10px]", styles[status])}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <DashboardLayout title="Tenants">
      
      {/* HEADER & CONTROLS */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/50 pl-9 focus:bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_move_in">Pending Move-In</SelectItem>
                <SelectItem value="notice_period">Notice Period</SelectItem>
                <SelectItem value="moved_out">Moved Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>
        </div>

        {/* BULK ACTIONS BAR */}
        {selectedTenantIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium">{selectedTenantIds.size} tenant(s) selected</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" /> Send Reminder
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* TENANTS LIST - EMPTY STATE */}
      {filteredTenants.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <UserMinus className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">No tenants found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Please adjust your search or filter criteria, or add a new tenant to get started.
          </p>
          <Button className="mt-6" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add your first tenant
          </Button>
        </div>
      )}

      {/* MOBILE CARDS VIEW */}
      {filteredTenants.length > 0 && (
        <div className="grid gap-4 md:hidden">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setViewTenantId(tenant.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={tenant.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials(tenant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{tenant.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(tenant.status)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setViewTenantId(tenant.id)}>
                        <FileText className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setViewTenantId(tenant.id); setTimeout(() => { setEditTenantForm(tenant); setIsEditingTenant(true); }, 50); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                         <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                         <Mail className="mr-2 h-4 w-4" /> Send Reminder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {tenant.status !== 'moved_out' && (
                        <DropdownMenuItem onClick={() => setMoveOutTenantId(tenant.id)}>
                           <ArrowUpDown className="mr-2 h-4 w-4" /> Start Move-Out
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={tenant.status === "active" || tenant.status === "notice_period"}
                        onClick={() => handleDelete(tenant.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Tenant
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4 shrink-0" />
                    <span className="truncate">Room {tenant.roomNumber} - {tenant.bedNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tenant.phone}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                    <p className="font-semibold">₹{tenant.rentAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">{tenant.dueDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DESKTOP TABLE VIEW */}
      {filteredTenants.length > 0 && (
        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={filteredTenants.length > 0 && selectedTenantIds.size === filteredTenants.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Tenant</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Room & Bed</TableHead>
                  <TableHead className="font-semibold">Rent + Extra</TableHead>
                  <TableHead className="font-semibold">Deposit</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow 
                    key={tenant.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedTenantIds.has(tenant.id) && "bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => setViewTenantId(tenant.id)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                       <Checkbox
                        checked={selectedTenantIds.has(tenant.id)}
                        onCheckedChange={() => toggleSelectTenant(tenant.id)}
                        aria-label={`Select ${tenant.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={tenant.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials(tenant.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{tenant.name}</span>
                          <span className="text-xs text-muted-foreground">Due: {tenant.dueDate}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{tenant.phone}</span>
                        {tenant.email && <span className="text-xs text-muted-foreground">{tenant.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">Room {tenant.roomNumber}</span>
                        <span className="text-xs text-muted-foreground">Bed {tenant.bedNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                        <span className="font-medium">₹{tenant.rentAmount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">+ ₹{tenant.extraCharges.toLocaleString()} extra</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">₹{tenant.deposit.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setViewTenantId(tenant.id)}>
                            <FileText className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setViewTenantId(tenant.id); setTimeout(() => { setEditTenantForm(tenant); setIsEditingTenant(true); }, 50); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.status !== 'moved_out' && (
                            <DropdownMenuItem onClick={() => setMoveOutTenantId(tenant.id)}>
                              <ArrowUpDown className="mr-2 h-4 w-4" /> Start Move-Out
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={tenant.status === "active" || tenant.status === "notice_period"}
                            onClick={() => handleDelete(tenant.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Tenant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* --- MODALS & DRAWERS --- */}

      {/* 1. Tenant Profile Sidebar (with inline edit mode, like Rooms page) */}
      <Sheet open={!!viewTenantId} onOpenChange={(open) => { if (!open) { setViewTenantId(null); setIsEditingTenant(false); setShowIdDocument(false); } }}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-background">
          {activeTenant && (
            <>
              <SheetHeader className="border-b bg-muted/20 p-6 shrink-0 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={activeTenant.avatar} />
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">{initials(activeTenant.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl">{activeTenant.name}</SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-2">
                       <Home className="h-4 w-4" /> Room {activeTenant.roomNumber} - Bed {activeTenant.bedNumber}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activeTenant.status)}
                  {!isEditingTenant && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditTenantForm(activeTenant); setIsEditingTenant(true); }}
                      className="h-9 px-3 gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="mb-4 grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details & Financials</TabsTrigger>
                      <TabsTrigger value="history">Payment History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-8">
                      {/* Financial Info - Quick Stats (read-only) */}
                      {!isEditingTenant && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Monthly Rent</p>
                            <p className="text-lg font-bold">₹{activeTenant.rentAmount.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Due Date</p>
                            <p className="text-lg font-bold">{activeTenant.dueDate}</p>
                          </div>
                        </div>
                      )}

                      {/* Editable Tenant Financial Info */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                          <CreditCard className="h-4 w-4 text-primary" />
                          FINANCIAL DETAILS
                        </div>
                        <div className="grid gap-4">
                          {[
                            { label: "Monthly Rent (₹)", value: activeTenant.rentAmount, key: "rentAmount" as const, type: "number" },
                            { label: "Extra Charges / Deductions (₹)", value: activeTenant.extraCharges, key: "extraCharges" as const, type: "number" },
                            { label: "Security Deposit (₹)", value: activeTenant.deposit, key: "deposit" as const, type: "number" },
                            { label: "Rent Due Date", value: activeTenant.dueDate, key: "dueDate" as const, type: "text" },
                          ].map((field) => (
                            <div key={field.key} className="grid grid-cols-5 items-center gap-4">
                              <Label className="col-span-2 text-xs font-medium text-muted-foreground">{field.label}</Label>
                              <div className="col-span-3">
                                {isEditingTenant ? (
                                  <Input
                                    className="h-9"
                                    type={field.type}
                                    value={(editTenantForm[field.key] as any) || ""}
                                    onChange={(e) => setEditTenantForm(prev => ({ ...prev, [field.key]: field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
                                  />
                                ) : (
                                  <p className="text-sm font-semibold">
                                    {field.type === "number" ? `₹${(field.value as number).toLocaleString()}` : field.value}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Editable Contact Info */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                          <Phone className="h-4 w-4 text-primary" />
                          CONTACT INFORMATION
                        </div>
                        <div className="grid gap-4">
                          {[
                            { label: "Phone Number", value: activeTenant.phone, key: "phone" as const, type: "text" },
                            { label: "Email", value: activeTenant.email || "—", key: "email" as const, type: "email" },
                          ].map((field) => (
                            <div key={field.key} className="grid grid-cols-5 items-center gap-4">
                              <Label className="col-span-2 text-xs font-medium text-muted-foreground">{field.label}</Label>
                              <div className="col-span-3">
                                {isEditingTenant ? (
                                  <Input
                                    className="h-9"
                                    type={field.type}
                                    value={(editTenantForm[field.key] as any) || ""}
                                    onChange={(e) => setEditTenantForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  />
                                ) : (
                                  <p className="text-sm font-semibold">{field.value}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Identity & Agreement (read-only) */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                          <Info className="h-4 w-4 text-primary" />
                          IDENTITY & AGREEMENT
                        </div>
                        <div className="grid gap-4">
                          {[
                            { label: "ID Type", value: activeTenant.idType },
                            { label: "Agreement Duration", value: activeTenant.agreementDuration },
                            { label: "Move-in Date", value: activeTenant.moveInDate },
                          ].map((field) => (
                            <div key={field.label} className="grid grid-cols-5 items-center gap-4">
                              <Label className="col-span-2 text-xs font-medium text-muted-foreground">{field.label}</Label>
                              <div className="col-span-3">
                                <p className="text-sm font-semibold">{field.value}</p>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-5 items-center gap-4">
                            <Label className="col-span-2 text-xs font-medium text-muted-foreground">Uploaded ID</Label>
                            <div className="col-span-3 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowIdDocument(!showIdDocument)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              >
                                {showIdDocument ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                {showIdDocument ? "Hide Document" : "View Document"}
                              </Button>
                            </div>
                          </div>
                          {showIdDocument && (
                            <div className="mt-2 p-4 border rounded-xl bg-muted/20 flex flex-col items-center justify-center h-40">
                              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">ID Document Preview</span>
                              <span className="text-xs text-muted-foreground mt-1">(Image/PDF will be shown here)</span>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Notes */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                          <FileText className="h-4 w-4 text-primary" />
                          NOTES
                        </div>
                        {isEditingTenant ? (
                          <Textarea
                            placeholder="Write notes about this tenant..."
                            className="text-sm min-h-[100px] bg-muted/20"
                            value={editTenantForm.notes || ""}
                            onChange={(e) => setEditTenantForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        ) : (
                          <div className="p-4 bg-muted/20 rounded-xl text-sm italic text-muted-foreground">
                            {activeTenant.notes || "No notes added for this tenant yet."}
                          </div>
                        )}
                      </section>
                    </TabsContent>

                    <TabsContent value="history">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date Paid</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeTenant.paymentHistory.length === 0 ? (
                               <TableRow>
                                 <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No payment history available.</TableCell>
                               </TableRow>
                            ) : (
                              activeTenant.paymentHistory.map(ph => (
                                <TableRow key={ph.id}>
                                  <TableCell className="font-medium">{ph.month}</TableCell>
                                  <TableCell>₹{(ph.rent + ph.extraCharges).toLocaleString()}</TableCell>
                                  <TableCell>{getPaymentStatusBadge(ph.status)}</TableCell>
                                  <TableCell className="text-muted-foreground">{ph.paidDate || "-"}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {isEditingTenant && (
                <SheetFooter className="p-6 border-t bg-background shrink-0 flex flex-row sm:justify-start gap-3">
                  <Button
                    className="flex-1 h-11 shadow-lg bg-primary hover:bg-primary/90"
                    onClick={() => {
                      // Apply edits to tenants state
                      setTenants(prev => prev.map(t => t.id === activeTenant.id ? { ...t, ...editTenantForm } as Tenant : t))
                      setIsEditingTenant(false)
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => { setIsEditingTenant(false); setEditTenantForm(activeTenant); }}
                  >
                    Cancel
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 2. Add Tenant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] !max-h-[85vh] !flex !flex-col !gap-0 p-0" showCloseButton={true}>
          <div className="p-6 pb-3 shrink-0">
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription className="mt-1.5">
              Complete the tenant profile, room allocation, and financial terms.
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-6">
            <div className="grid gap-8 py-4 pb-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><div className="h-6 w-1 bg-primary rounded-full"></div>Basic Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="add-name">Tenant Name <span className="text-destructive">*</span></Label>
                    <Input id="add-name" placeholder="Full legal name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="add-phone">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="add-phone" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="add-email">Email (Optional)</Label>
                    <Input id="add-email" type="email" placeholder="tenant@example.com" />
                  </div>
                </div>
              </div>

              {/* Room Allocation */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><div className="h-6 w-1 bg-primary rounded-full"></div>Room Allocation</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Select Floor <span className="text-destructive">*</span></Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select a floor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground">Ground Floor</SelectItem>
                        <SelectItem value="1st">1st Floor</SelectItem>
                        <SelectItem value="2nd">2nd Floor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Select Room <span className="text-destructive">*</span></Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="101">101  (2 beds available)</SelectItem>
                        <SelectItem value="102">102  (1 bed available)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Financials & Dates */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><div className="h-6 w-1 bg-primary rounded-full"></div>Financials & Terms</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Security Deposit</Label>
                    <Input type="number" placeholder="₹" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Extra Charges / Deductions (₹)</Label>
                    <Input type="number" placeholder="₹" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Rent Due Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Move-In Date</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>

              {/* Identity & Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2"><div className="h-6 w-1 bg-primary rounded-full"></div>Verification & Notes</h4>
                  {tenantIds.length < 3 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addIdRow}
                      className="h-8 text-[11px] gap-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      Add ID
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-4">
                  {tenantIds.map((doc, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                      <div className="grid gap-2">
                        <Label className="text-xs">ID Type {index + 1}</Label>
                        <Select 
                          value={doc.type} 
                          onValueChange={(val) => updateIdType(index, val)}
                        >
                          <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="dl">Driving License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id={`upload-id-${index}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUploadId(index, e)}
                            accept="image/*,.pdf"
                          />
                          <Button 
                            type="button" 
                            variant={doc.fileName ? "secondary" : "outline"} 
                            className={cn("h-9 w-full gap-2 border-dashed", doc.fileName && "border-solid bg-success/5 text-success hover:bg-success/10 border-success/20")}
                            asChild
                          >
                            <label htmlFor={`upload-id-${index}`} className="cursor-pointer">
                              {doc.fileName ? (
                                <FileText className="h-4 w-4 shrink-0" />
                              ) : (
                                <Upload className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{doc.fileName || "Upload ID"}</span>
                            </label>
                          </Button>
                        </div>
                        {index > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => removeIdRow(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="grid gap-2 pt-2">
                    <Label>Initial Notes</Label>
                    <Textarea placeholder="Any specific requirements, food preferences, etc." className="h-20 resize-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4 border-t bg-background shrink-0 flex justify-end gap-3">
             <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
             <Button onClick={() => setIsAddDialogOpen(false)}>Save Tenant</Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Edit Tenant is now handled inline in the sidebar above */}

      {/* 4. Move-Out Workflow Dialog */}
      <Dialog open={!!moveOutTenantId} onOpenChange={(open) => !open && setMoveOutTenantId(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <UserMinus className="h-5 w-5" /> Start Move-Out Process
            </DialogTitle>
            <DialogDescription>
              Initiate move-out and calculate final settlement for {movingOutTenant?.name}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            {movingOutTenant && (
              <div className="space-y-6 py-4">
               <div className="rounded-lg border bg-muted/30 p-4 flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Original Deposit:</span>
                 <span className="font-semibold text-lg">₹{movingOutTenant.deposit.toLocaleString()}</span>
               </div>
               
               <div className="grid gap-4 sm:grid-cols-2">
                 <div className="grid gap-2">
                    <Label>Move-out Date <span className="text-destructive">*</span></Label>
                    <Input type="date" />
                 </div>
                 <div className="grid gap-2">
                    <Label>Reason</Label>
                    <Select defaultValue="city">
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">Leaving City</SelectItem>
                        <SelectItem value="pg">Switching PG</SelectItem>
                        <SelectItem value="personal">Personal Reasons</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>

               <div className="space-y-4 border-t pt-4">
                 <h4 className="font-medium text-sm">Deposit Deductions (₹)</h4>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Pending Rent</Label>
                      <Input type="number" defaultValue="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Damages</Label>
                      <Input type="number" defaultValue="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Cleaning</Label>
                      <Input type="number" defaultValue="500" />
                    </div>
                 </div>
               </div>

               <div className="space-y-4 border-t pt-4">
                 <h4 className="font-medium text-sm">Refund Details</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Refund Method</Label>
                      <Select defaultValue="upi">
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Final Refund Amount</Label>
                      <Input type="number" defaultValue={movingOutTenant.deposit - 500} className="font-semibold text-success border-success/50" />
                    </div>
                 </div>
               </div>
            </div>
          )}
            </ScrollArea>
            <div className="p-6 pt-4 border-t bg-background mt-auto flex justify-end gap-3">
               <Button variant="outline" onClick={() => setMoveOutTenantId(null)}>Cancel</Button>
               <Button variant="destructive" onClick={() => {
                  // Mock setting status to notice period / moved out
                  setMoveOutTenantId(null);
               }}>Confirm Move-Out</Button>
            </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
