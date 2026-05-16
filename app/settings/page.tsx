"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Bell, CreditCard, User, Shield, Save } from "lucide-react"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [autoReminders, setAutoReminders] = useState(true)

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Property Details */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Property Details</CardTitle>
                <CardDescription className="mt-0.5">
                  Basic information about your PG property
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="propertyName" className="text-sm font-medium">Property Name</Label>
                <Input id="propertyName" defaultValue="Sunshine PG" className="bg-muted/50 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-sm font-medium">Owner Name</Label>
                <Input id="ownerName" defaultValue="Rajesh Kumar" className="bg-muted/50 focus:bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Textarea
                id="address"
                defaultValue="123, MG Road, Koramangala, Bangalore - 560034"
                className="resize-none bg-muted/50 focus:bg-background"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Contact Phone</Label>
                <Input id="phone" defaultValue="+91 98765 43210" className="bg-muted/50 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Contact Email</Label>
                <Input id="email" type="email" defaultValue="admin@sunshinepg.com" className="bg-muted/50 focus:bg-background" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Payment Settings</CardTitle>
                <CardDescription className="mt-0.5">
                  Configure default payment options
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultDueDate" className="text-sm font-medium">Default Due Date</Label>
                <Select defaultValue="5">
                  <SelectTrigger id="defaultDueDate" className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st of every month</SelectItem>
                    <SelectItem value="5">5th of every month</SelectItem>
                    <SelectItem value="10">10th of every month</SelectItem>
                    <SelectItem value="15">15th of every month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateFee" className="text-sm font-medium">Late Payment Fee (%)</Label>
                <Input id="lateFee" type="number" defaultValue="5" className="bg-muted/50 focus:bg-background" onWheel={(e) => (e.target as HTMLElement).blur()} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gracePeriod" className="text-sm font-medium">Grace Period (days)</Label>
                <Input id="gracePeriod" type="number" defaultValue="3" className="bg-muted/50 focus:bg-background" onWheel={(e) => (e.target as HTMLElement).blur()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                <Select defaultValue="INR">
                  <SelectTrigger id="currency" className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="bankDetails" className="text-sm font-medium">Bank Account Details</Label>
              <Textarea
                id="bankDetails"
                placeholder="Enter bank account details for payment reference"
                defaultValue="Bank: HDFC Bank&#10;Account: 1234567890&#10;IFSC: HDFC0001234"
                className="min-h-[100px] resize-none bg-muted/50 focus:bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription className="mt-0.5">
                  Manage how you receive notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for payments and updates
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get SMS alerts for important updates
                </p>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Automatic Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send automatic payment reminders to tenants
                </p>
              </div>
              <Switch
                checked={autoReminders}
                onCheckedChange={setAutoReminders}
              />
            </div>
            {autoReminders && (
              <div className="ml-0 mt-2 space-y-3 rounded-lg border bg-muted/30 p-4 sm:ml-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays" className="text-sm font-medium">Days before due date</Label>
                    <Input id="reminderDays" type="number" defaultValue="3" className="bg-background" onWheel={(e) => (e.target as HTMLElement).blur()} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime" className="text-sm font-medium">Reminder time</Label>
                    <Input id="reminderTime" type="time" defaultValue="09:00" className="bg-background" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Account</CardTitle>
                <CardDescription className="mt-0.5">
                  Manage your account settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input id="username" defaultValue="admin" className="bg-muted/50 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-sm font-medium">Email</Label>
                <Input id="adminEmail" type="email" defaultValue="admin@pgmanager.com" className="bg-muted/50 focus:bg-background" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Change Password</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="password" placeholder="Current password" className="bg-muted/50 focus:bg-background" />
                <Input type="password" placeholder="New password" className="bg-muted/50 focus:bg-background" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription className="mt-0.5">
                  Security and privacy settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Enable</Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically logout after inactivity
                </p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-full bg-muted/50 sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
          <Button size="lg" className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
