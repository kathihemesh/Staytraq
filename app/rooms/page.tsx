"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Users, 
  DoorOpen, 
  Pencil, 
  Filter, 
  IndianRupee, 
  Bed, 
  Wrench, 
  CheckCircle2, 
  X,
  ChevronRight,
  Info,
  History,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"


import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { toast } from "sonner"
import { runWithNetworkRetry } from "@/lib/networkRetry"

// --- TYPES ---

interface BedInfo {
  id: string
  label: string
  occupantName: string | null
}

interface MaintenanceDetails {
  issue: string
  expectedCompletionDate: string
  notes: string
}

interface Room {
  id: string
  number: string
  floor: string
  floorNo: number
  type: "AC" | "Non-AC"
  status: "vacant" | "partially occupied" | "full" | "maintenance"
  capacity: number
  rentAmount: number
  maintenanceFee: number
  notes: string
  beds: BedInfo[]
  occupiedBeds: number
  maintenanceDetails?: MaintenanceDetails
}

// --- HELPER FUNCTIONS ---

function floorNoToLabel(floorNo: number): string {
  if (floorNo === 0) return "Ground Floor"
  if (floorNo === 1) return "1st Floor"
  if (floorNo === 2) return "2nd Floor"
  if (floorNo === 3) return "3rd Floor"
  return `${floorNo}th Floor`
}

function roomTypeToUi(dbType: string): "AC" | "Non-AC" {
  return dbType === "ac" ? "AC" : "Non-AC"
}

function roomTypeToDb(uiType: "AC" | "Non-AC"): string {
  return uiType === "AC" ? "ac" : "non-ac"
}

function generateBeds(totalBeds: number, occupiedBeds: number): BedInfo[] {
  return Array.from({ length: totalBeds }, (_, i) => ({
    id: `bed-${String.fromCharCode(65 + i)}`,
    label: `Bed ${String.fromCharCode(65 + i)}`,
    occupantName: i < occupiedBeds ? `Occupied` : null,
  }))
}

function mapDbRowToRoom(row: any): Room {
  const totalBeds = Number(row.total_beds) || 0
  const occupiedBeds = Number(row.occupied_beds) || 0
  
  let computedStatus = row.status || "vacant"
  
  if (computedStatus !== "maintenance") {
    if (occupiedBeds === 0) {
      computedStatus = "vacant"
    } else if (occupiedBeds >= totalBeds) {
      computedStatus = "full"
    } else {
      computedStatus = "partially occupied"
    }
  }

  return {
    id: String(row.id),
    number: row.room_number || "",
    floor: floorNoToLabel(Number(row.floor_no) || 0),
    floorNo: Number(row.floor_no) || 0,
    type: roomTypeToUi(row.room_type || "non-ac"),
    status: computedStatus,
    capacity: totalBeds,
    rentAmount: Number(row.rent_amount) || 0,
    maintenanceFee: Number(row.maintenance) || 0,
    notes: row.notes || "",
    beds: generateBeds(totalBeds, occupiedBeds),
    occupiedBeds: occupiedBeds,
  }
}

// --- COMPONENT ---

export default function RoomsPage() {
  const supabase = createClient()
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [pgMissing, setPgMissing] = useState(false)

  // PG context
  const [pgId, setPgId] = useState<number | null>(null)
  // `no_floors` is the highest floor number (0 => only Ground Floor).
  const [noFloors, setNoFloors] = useState<number>(0)

  // Generate available floors from noFloors
  const availableFloors = useMemo(() => {
    return Array.from({ length: noFloors + 1 }, (_, i) => ({
      value: i,
      label: floorNoToLabel(i),
    }))
  }, [noFloors])
  
  // Sidebar Edit Form State
  const [editForm, setEditForm] = useState<Partial<Room>>({})
  
  // Filters State
  const [filters, setFilters] = useState({
    floor: "All Floors",
    type: "All Types",
    status: "All Statuses",
    capacity: "All Capacities"
  })

  const capacityOptions = useMemo(() => {
    const caps = Array.from(
      new Set(rooms.map((r) => r.capacity).filter((c) => Number.isFinite(c) && c > 0))
    ).sort((a, b) => a - b)
    return ["All Capacities", ...caps.map((c) => `${c} Sharing`)]
  }, [rooms])

  // Add Room Form State
  const [addForm, setAddForm] = useState({
    number: "",
    floorNo: 0,
    type: "Non-AC" as "AC" | "Non-AC",
    capacity: 2,
    rentAmount: 12000,
    maintenanceFee: 1000,
    notes: ""
  })

  // Fetch PG details and rooms
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      // Avoid trapping UI in a loading state if auth is transiently unavailable.
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }
    if (!hasLoadedOnce) setIsLoading(true)
    else setIsRefreshing(true)
    setPageError(null)
    setPgMissing(false)
    try {
      // 1. Get pg_details for this owner
      const { data: pgData, error: pgError } = await runWithNetworkRetry(() =>
        supabase
          .from("pg_details")
          .select("id, no_floors")
          .eq("owner_id", user.id)
          .maybeSingle()
      )

      if (pgError) {
        console.error("Error fetching pg_details:", pgError)
        const msg = pgError.message || "Failed to load PG details."
        setPageError(msg)
        toast.error(msg)
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      if (!pgData?.id) {
        setPgId(null)
        setRooms([])
        setPgMissing(true)
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      setPgId(pgData.id)
      // IMPORTANT: `0` is a valid value (Ground floor only). Don't coerce it to 1.
      const nextNoFloors =
        pgData.no_floors === null || pgData.no_floors === undefined ? 0 : Number(pgData.no_floors)
      setNoFloors(Number.isFinite(nextNoFloors) ? nextNoFloors : 0)

      // 2. Fetch rooms for this pg
      const { data: roomsData, error: roomsError } = await runWithNetworkRetry(() =>
        supabase
          .from("rooms_table")
          .select(
            "id, pg_id, room_number, floor_no, room_type, status, total_beds, occupied_beds, rent_amount, maintenance, notes"
          )
          .eq("pg_id", pgData.id)
          .order("floor_no", { ascending: true })
          .order("room_number", { ascending: true })
      )

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError)
        const msg = roomsError.message || "Failed to load rooms."
        setPageError(msg)
        toast.error(msg)
        setRooms([])
      } else {
        setRooms((roomsData || []).map(mapDbRowToRoom))
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setPageError("Unexpected error while loading rooms.")
      toast.error("Unexpected error while loading rooms.")
    }
    setIsLoading(false)
    setIsRefreshing(false)
    setHasLoadedOnce(true)
  }, [user?.id, hasLoadedOnce])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime: keep rooms in sync without refetching on navigation/focus.
  useEffect(() => {
    if (!pgId) return

    const channel = supabase
      .channel(`rooms_table_pg_${pgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms_table",
          filter: `pg_id=eq.${pgId}`,
        },
        (payload) => {
          const eventType = payload.eventType
          if (eventType === "INSERT") {
            const next = mapDbRowToRoom(payload.new)
            setRooms((prev) => {
              if (prev.some((r) => r.id === next.id)) return prev
              const merged = [...prev, next]
              merged.sort((a, b) => a.floorNo - b.floorNo || a.number.localeCompare(b.number))
              return merged
            })
          } else if (eventType === "UPDATE") {
            const next = mapDbRowToRoom(payload.new)
            setRooms((prev) => prev.map((r) => (r.id === next.id ? next : r)))
            setSelectedRoom((prev) => (prev?.id === next.id ? { ...prev, ...next } : prev))
            setEditForm((prev) => ((prev as any)?.id === next.id ? { ...prev, ...next } : prev))
          } else if (eventType === "DELETE") {
            const deletedId = String((payload.old as any)?.id)
            setRooms((prev) => prev.filter((r) => r.id !== deletedId))
            setSelectedRoom((prev) => (prev?.id === deletedId ? null : prev))
            setIsSidebarOpen((open) => {
              if (selectedRoom?.id === deletedId) return false
              return open
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgId])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = room.number.toLowerCase().includes(search.toLowerCase())
      
      const matchesFloor = filters.floor === "All Floors" || room.floor === filters.floor
      const matchesType = filters.type === "All Types" || room.type === filters.type
      const matchesStatus = filters.status === "All Statuses" || room.status === filters.status.toLowerCase()
      const matchesCapacity =
        filters.capacity === "All Capacities"
          ? true
          : (() => {
              const n = Number.parseInt(filters.capacity, 10)
              return Number.isFinite(n) && room.capacity === n
            })()

      return matchesSearch && matchesFloor && matchesType && matchesStatus && matchesCapacity
    })
  }, [rooms, search, filters])

  useEffect(() => {
    // If selected capacity is no longer available (after refetch/edit), reset.
    if (!capacityOptions.includes(filters.capacity)) {
      setFilters((prev) => ({ ...prev, capacity: "All Capacities" }))
    }
  }, [capacityOptions, filters.capacity])

  const stats = useMemo(() => {
    return {
      vacant: rooms.filter(r => r.status === "vacant").length,
      partial: rooms.filter(r => r.status === "partially occupied").length,
      full: rooms.filter(r => r.status === "full").length,
      maintenance: rooms.filter(r => r.status === "maintenance").length
    }
  }, [rooms])

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room)
    setEditForm(room)
    setIsEditing(false)
    setIsSidebarOpen(true)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm(selectedRoom || {})
  }

  const handleSaveEdit = async () => {
    if (!selectedRoom) return
    
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
        // Persist status changes (e.g. maintenance) from the edit UI.
        status: (editForm.status as Room["status"] | undefined) ?? selectedRoom.status,
      }

      // Only send defined fields to avoid unexpected PostgREST behavior.
      if (typeof editForm.number === "string") updatePayload.room_number = editForm.number
      if (typeof editForm.floorNo === "number") updatePayload.floor_no = editForm.floorNo
      if (editForm.type) updatePayload.room_type = roomTypeToDb(editForm.type as "AC" | "Non-AC")
      if (typeof editForm.capacity === "number") updatePayload.total_beds = editForm.capacity
      if (typeof editForm.rentAmount === "number") updatePayload.rent_amount = editForm.rentAmount
      if (typeof editForm.maintenanceFee === "number") updatePayload.maintenance = editForm.maintenanceFee
      if (typeof editForm.notes === "string") updatePayload.notes = editForm.notes

      const { error } = await supabase
        .from("rooms_table")
        .update(updatePayload)
        .eq("id", Number(selectedRoom.id))

      if (error) {
        console.error("Error updating room:", error)
        toast.error(error.message || "Failed to update room.")
        return
      }

      await fetchData()
      toast.success("Room updated.")
      setIsEditing(false)
      setIsSidebarOpen(false)
    } catch (err) {
      console.error("Error saving edit:", err)
      toast.error("Network error while updating room. Please try again.")
    }
  }

  const handleResolveMaintenance = async () => {
    if (!selectedRoom) return
    try {
      const { error } = await supabase
        .from("rooms_table")
        .update({
          status: "vacant",
          updated_at: new Date().toISOString(),
        })
        .eq("id", Number(selectedRoom.id))

      if (error) {
        console.error("Error resolving maintenance:", error)
        toast.error(error.message || "Failed to resolve maintenance.")
        return
      }

      // Update sidebar immediately (avoids stale state while rooms refetches).
      setSelectedRoom((prev) => (prev ? { ...prev, status: "vacant" } : prev))
      setEditForm((prev) => ({ ...prev, status: "vacant" }))

      await fetchData()
      toast.success("Maintenance resolved.")
    } catch (err) {
      console.error("Error:", err)
      toast.error("Network error while resolving maintenance.")
    }
  }

  const getStatusConfig = (status: Room["status"]) => {
    switch (status) {
      case "vacant":
        return { label: "Vacant", color: "bg-success text-success-foreground", border: "border-success/30", badge: "bg-success/10 text-success", track: "bg-success/20" }
      case "partially occupied":
        return { label: "Partially Occupied", color: "bg-warning text-warning-foreground", border: "border-warning/30", badge: "bg-warning/10 text-warning", track: "bg-warning/20" }
      case "full":
        return { label: "Full", color: "bg-destructive text-destructive-foreground", border: "border-destructive/30", badge: "bg-destructive/10 text-destructive", track: "bg-destructive/20" }
      case "maintenance":
        return { label: "Maintenance", color: "bg-orange-500 text-white", border: "border-orange-500/30", badge: "bg-orange-500/10 text-orange-600", track: "bg-orange-500/20" }
    }
  }

  // Handle Add Room
  const handleAddRoom = async () => {
    if (!pgId) return
    setIsAdding(true)
    try {
      const { error } = await supabase
        .from("rooms_table")
        .insert({
          pg_id: pgId,
          room_number: addForm.number || "000",
          floor_no: addForm.floorNo,
          room_type: roomTypeToDb(addForm.type),
          total_beds: addForm.capacity,
          rent_amount: addForm.rentAmount,
          maintenance: addForm.maintenanceFee,
          notes: addForm.notes || "",
          status: "vacant",
          occupied_beds: 0,
        })

      if (error) {
        console.error("Error adding room:", error)
        const msg = error.message || "Failed to add room."
        toast.error(msg)
        setIsAdding(false)
        return
      }

      // Reset form and refresh
      setIsAddDialogOpen(false)
      setAddForm({
        number: "",
        floorNo: 0,
        type: "Non-AC",
        capacity: 2,
        rentAmount: 12000,
        maintenanceFee: 1000,
        notes: ""
      })
      await fetchData()
      toast.success("Room added.")
    } catch (err) {
      console.error("Error adding room:", err)
      toast.error("Unexpected error while adding room.")
    }
    setIsAdding(false)
  }

  // Handle Add Floor
  const handleAddFloor = async () => {
    if (!pgId) return
    const newNoFloors = noFloors + 1
    try {
      const { error } = await supabase
        .from("pg_details")
        .update({ no_floors: newNoFloors, updated_at: new Date().toISOString() })
        .eq("id", pgId)

      if (error) {
        console.error("Error adding floor:", error)
        return
      }

      setNoFloors(newNoFloors)
      // Auto-select the new floor
      setAddForm(prev => ({ ...prev, floorNo: newNoFloors }))
    } catch (err) {
      console.error("Error adding floor:", err)
    }
  }

  return (
    <DashboardLayout title="Rooms" fullWidth>
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-4">
        {[
          { label: "Vacant", count: stats.vacant, color: "text-success", bg: "bg-success/10", icon: DoorOpen },
          { label: "Partially Occupied", count: stats.partial, color: "text-warning", bg: "bg-warning/10", icon: Users },
          { label: "Full", count: stats.full, color: "text-destructive", bg: "bg-destructive/10", icon: DoorOpen },
          { label: "Maintenance", count: stats.maintenance, color: "text-orange-600", bg: "bg-orange-500/10", icon: Wrench },
        ].map((stat, i) => (
          <Card key={i} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Actions & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-muted/50 pl-9 focus:bg-background h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>
                    Enter the details to create a new room in the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-roomNumber">Room Number</Label>
                      <Input 
                        id="add-roomNumber" 
                        placeholder="e.g. 101" 
                        value={addForm.number}
                        onChange={(e) => setAddForm(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-floor">Floor Number</Label>
                      <Select 
                        value={String(addForm.floorNo)}
                        onValueChange={(val) => {
                          if (val === "add_new") {
                            handleAddFloor()
                          } else {
                            setAddForm(prev => ({ ...prev, floorNo: Number(val) }))
                          }
                        }}
                      >
                        <SelectTrigger id="add-floor">
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableFloors.map((floor) => (
                            <SelectItem key={floor.value} value={String(floor.value)}>{floor.label}</SelectItem>
                          ))}
                          <div className="h-[1px] bg-muted my-1" />
                          <SelectItem value="add_new" className="text-primary font-medium focus:text-primary cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5" />
                              Add Floor
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-type">Room Type</Label>
                      <Select 
                        value={addForm.type}
                        onValueChange={(val) => setAddForm(prev => ({ ...prev, type: val as "AC" | "Non-AC" }))}
                      >
                        <SelectTrigger id="add-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="Non-AC">Non-AC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-capacity">Capacity (Beds)</Label>
                      <Input 
                        id="add-capacity" 
                        type="number" 
                        placeholder="2" 
                        value={addForm.capacity}
                        onChange={(e) => setAddForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-rent">Monthly Rent (₹)</Label>
                      <Input 
                        id="add-rent" 
                        type="number" 
                        placeholder="12000" 
                        value={addForm.rentAmount}
                        onChange={(e) => setAddForm(prev => ({ ...prev, rentAmount: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-maintenance">Maintenance (₹)</Label>
                      <Input 
                        id="add-maintenance" 
                        type="number" 
                        placeholder="1000" 
                        value={addForm.maintenanceFee}
                        onChange={(e) => setAddForm(prev => ({ ...prev, maintenanceFee: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-notes">Room Notes</Label>
                    <Textarea 
                      id="add-notes" 
                      placeholder="Any special notes about the room..." 
                      className="min-h-[100px]" 
                      value={addForm.notes}
                      onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-11 px-6">
                    Cancel
                  </Button>
                  <Button onClick={handleAddRoom} disabled={isAdding} className="h-11 px-8 shadow-md">
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3">
          {[
            { key: "floor", options: ["All Floors", ...availableFloors.map(f => f.label)] },
            { key: "type", options: ["All Types", "AC", "Non-AC"] },
            { key: "status", options: ["All Statuses", "Vacant", "Partially Occupied", "Full", "Maintenance"] },
            { key: "capacity", options: capacityOptions }
          ].map((f) => (
            <Select 
              key={f.key} 
              onValueChange={(val) => setFilters(prev => ({ ...prev, [f.key]: val }))}
              defaultValue={filters[f.key as keyof typeof filters]}
            >
              <SelectTrigger className="h-10 w-auto min-w-[130px] bg-background border-border/50 text-sm">
                <SelectValue placeholder={f.key.charAt(0).toUpperCase() + f.key.slice(1)} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !hasLoadedOnce && (
        <div className="flex flex-col items-center justify-center p-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading rooms...</p>
        </div>
      )}

      {!isLoading && isRefreshing && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refreshing rooms…
        </div>
      )}

      {!isLoading && pgMissing && (
        <Card className="p-8">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg">Complete onboarding to manage rooms</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              We couldn’t find your PG details. Please complete onboarding first, then you can add rooms.
            </p>
            <Button asChild className="h-11 px-6">
              <Link href="/onboarding">Go to onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !pgMissing && pageError && (
        <Card className="p-6 border-destructive/40">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base text-destructive">Couldn’t load rooms</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <p className="text-sm text-muted-foreground">{pageError}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10" onClick={fetchData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms Grid */}
      {!isLoading && !pgMissing && !pageError && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full">
          {filteredRooms.map((room) => {
            const config = getStatusConfig(room.status)
            const occupancyCount = room.occupiedBeds
            
            return (
              <Card 
                key={room.id} 
                className="group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 relative"
                onClick={() => handleRoomClick(room)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    Room {room.number}
                  </CardTitle>
                  <Badge variant="outline" className={cn("text-[10px] font-semibold h-5 px-1.5 uppercase", config.badge)}>
                    {config.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Filter className="h-3 w-3" /> {room.floor}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        {room.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg group-hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-background/50 border border-border/40">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-semibold">{occupancyCount} / {room.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <span className="text-xs">₹</span>
                        <span className="text-sm">{(room.rentAmount / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className={cn("mt-4 h-1.5 w-full rounded-full overflow-hidden", config.track)}>
                    <div 
                      className={cn(
                        "h-full transition-all duration-500", 
                        config.color.split(" ")[0],
                        room.status === "maintenance" && "bg-maintenance-stripes"
                      )}
                      style={{ width: `${room.capacity > 0 ? (occupancyCount / room.capacity) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && !pgMissing && !pageError && filteredRooms.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 bg-muted/20 border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters, or add a new room to get started.</p>
          <Button 
            variant="link" 
            className="mt-2 text-primary"
            onClick={() => {
              setSearch("")
              setFilters({
                floor: "All Floors",
                type: "All Types",
                status: "All Statuses",
                capacity: "All Capacities"
              })
            }}
          >
            Clear all filters
          </Button>
        </Card>
      )}

      {/* Room Details Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto p-0 flex flex-col h-full bg-background">
          {selectedRoom && (
            <>
              <SheetHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                    <SheetTitle className="text-2xl font-bold">Room {selectedRoom.number}</SheetTitle>
                  </div>
                  <SheetDescription>{selectedRoom.floor} • {selectedRoom.type}</SheetDescription>
                </div>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isEditing}
                    onClick={handleEditClick}
                    className="h-9 px-3 gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6 space-y-8">
                  {/* Status & Quick Info */}
                  <section>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Status</p>
                        <Badge className={cn("font-semibold", getStatusConfig(selectedRoom.status).badge)}>
                          {getStatusConfig(selectedRoom.status).label}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Rent / Mo</p>
                        <p className="text-lg font-bold">₹{selectedRoom.rentAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </section>

                  {/* Editable Room Information */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                      <Info className="h-4 w-4 text-primary" />
                      ROOM INFORMATION
                    </div>

                    <div className="grid gap-4">
                      {[
                        { label: "Room Number", value: selectedRoom.number, key: "number" as const, type: "text" },
                        { label: "Floor", value: selectedRoom.floor, key: "floorNo" as const, type: "select" },
                        { label: "Room Type", value: selectedRoom.type, key: "type" as const, type: "select", options: ["AC", "Non-AC"] },
                        { label: "Capacity", value: selectedRoom.capacity, key: "capacity" as const, type: "number" },
                        { label: "Monthly Rent (₹)", value: selectedRoom.rentAmount, key: "rentAmount" as const, type: "number" },
                        { label: "Maintenance Fee (₹)", value: selectedRoom.maintenanceFee, key: "maintenanceFee" as const, type: "number" },
                      ].map((field) => (
                        <div key={field.key} className="grid grid-cols-5 items-center gap-4">
                          <Label className="col-span-2 text-xs font-medium text-muted-foreground">{field.label}</Label>
                          <div className="col-span-3">
                            {isEditing ? (
                              field.key === "floorNo" ? (
                                <Select 
                                  defaultValue={String(editForm.floorNo ?? selectedRoom.floorNo)}
                                  onValueChange={(val) => setEditForm(prev => ({ ...prev, floorNo: Number(val), floor: floorNoToLabel(Number(val)) }))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableFloors.map(opt => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.type === "select" ? (
                                <Select 
                                  defaultValue={editForm[field.key] as string}
                                  onValueChange={(val) => setEditForm(prev => ({ ...prev, [field.key]: val }))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input 
                                  className="h-9" 
                                  type={field.type}
                                  value={(editForm[field.key] as any) || ""}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, [field.key]: field.type === "number" ? parseInt(e.target.value) : e.target.value }))}
                                />
                              )
                            ) : (
                              <p className="text-sm font-semibold">{field.value}{field.label.includes("Fee") ? " / Mo" : ""}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Bed Allocation */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                      <Bed className="h-4 w-4 text-primary" />
                      BED ALLOCATION
                    </div>
                    <div className="space-y-3">
                      {selectedRoom.beds.map((bed, idx) => (
                        <div key={bed.id} className="flex items-center justify-between p-3 border rounded-xl bg-background shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg border",
                              bed.occupantName ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-dashed"
                            )}>
                              <Bed className={cn("h-4 w-4", bed.occupantName ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{bed.label}</p>
                              <p className={cn("text-[11px]", bed.occupantName ? "text-success font-medium" : "text-muted-foreground italic")}>
                                {bed.occupantName || "Vacant"}
                              </p>
                            </div>
                          </div>
                          {bed.occupantName && (
                            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-semibold text-primary">
                              View Tenant
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Maintenance Management */}
                  <section className="space-y-4 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-orange-500 pl-3">
                        <Wrench className="h-4 w-4 text-orange-500" />
                        MAINTENANCE
                      </div>
                      {!isEditing && selectedRoom.status === "maintenance" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-success h-8 gap-1.5"
                          onClick={handleResolveMaintenance}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </Button>
                      )}
                    </div>

                    {(isEditing || selectedRoom.status === "maintenance") ? (
                      <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/50">
                        {isEditing ? (
                          <div className="flex items-center gap-3 py-2">
                             <Label htmlFor="mark-maintenance" className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                               Mark for Maintenance
                             </Label>
                             <Select 
                                value={editForm.status === "maintenance" ? "true" : "false"}
                                onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val === "true" ? "maintenance" : "vacant" }))}
                             >
                               <SelectTrigger className="w-24 h-8 text-[10px]">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="true">Yes</SelectItem>
                                 <SelectItem value="false">No</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            ROOM UNDER MAINTENANCE
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs font-semibold h-10 border-dashed border-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                        onClick={() => {
                          setIsEditing(true)
                          setEditForm(prev => ({ ...prev, status: "maintenance" }))
                        }}
                      >
                        <Wrench className="h-3.5 w-3.5 mr-2" />
                        Move to Maintenance
                      </Button>
                    )}
                  </section>

                  {/* Room Notes */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold border-l-4 border-primary pl-3">
                      <History className="h-4 w-4 text-primary" />
                      ROOM NOTES
                    </div>
                    {isEditing ? (
                      <Textarea 
                        placeholder="Write special notes or instructions for this room..."
                        className="text-sm min-h-[100px] bg-muted/20"
                        value={editForm.notes || ""}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    ) : (
                      <div className="p-4 bg-muted/20 rounded-xl text-sm italic text-muted-foreground">
                        {selectedRoom.notes || "No notes added for this room yet."}
                      </div>
                    )}
                  </section>
                </div>
              </div>

              {isEditing && (
                <SheetFooter className="p-6 border-t bg-background shrink-0 flex flex-row sm:justify-start gap-3">
                  <Button 
                    className="flex-1 h-11 shadow-lg bg-primary hover:bg-primary/90"
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-11"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
