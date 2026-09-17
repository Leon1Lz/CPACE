"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"


export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete account")
        setDeleting(false)
        return
      }
      setDeleteOpen(false)
      await signOut({ callbackUrl: "/" })
    } catch {
      setDeleteError("Network error — please try again")
      setDeleting(false)
    }
  }


  useEffect(() => {
    fetch("/api/users/me").then(r => r.json()).then(data => {
      if (data.id) {
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        })
      }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setProfileError("")
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setProfileError(data.error ?? "Failed to save"); return }
    update({ name: `${form.firstName} ${form.lastName}` })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = async () => {
    setPwError("")
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("New passwords do not match"); return }
    setPwSaving(true)
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    setPwSaving(false)
    if (!res.ok) { setPwError(data.error ?? "Failed to update password"); return }
    setPwSaved(true)
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setTimeout(() => setPwSaved(false), 3000)
  }

  const role = session?.user?.role?.toLowerCase()
  const roleColors: Record<string, string> = {
    admin: "bg-rose-100 text-rose-700 border-rose-200",
    instructor: "bg-blue-100 text-blue-700 border-blue-200",
    learner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, password, and account</p>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {form.firstName?.[0]}{form.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{session?.user?.name}</p>
              <p className="text-sm text-gray-400">{session?.user?.email}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block capitalize ${roleColors[role ?? "learner"]}`}>
                {role}
              </span>
            </div>
          </div>

          <Separator className="bg-gray-100" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input type="tel" placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" />
          </div>

          {profileError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{profileError}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <CheckCircle className="h-4 w-4 mr-2" /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} className="rounded-xl" />
          </div>
          {pwError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{pwError}
            </div>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
              <CheckCircle className="h-4 w-4 shrink-0" />Password updated successfully
            </div>
          )}
          <Button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword} variant="outline" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
            {pwSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />} Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-0 shadow-md border-red-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-600">
            <Shield className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500">
                  This action cannot be undone. This will permanently delete your account and remove all your data (enrolled courses, results, and certificates) from our database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {deleteError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {deleteError}
                </div>
              )}

              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="rounded-xl" disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAccount();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

    </div>
  )
}
