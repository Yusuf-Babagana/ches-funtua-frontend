"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { registrarAPI } from "@/lib/api"
import { CheckCircle, Loader2, UserPlus, FileText } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [matricInput, setMatricInput] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user?.role === "registrar") {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await registrarAPI.getPendingMatricAssignments()
      // response might be { total_pending: x, applications: [...] }
      if (response.applications) {
        setApplications(response.applications)
      }
    } catch (error) {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAssign = (app: any) => {
    setSelectedApp(app)
    setMatricInput(app.suggested_matric || "")
  }

  const handleAssignMatric = async () => {
    if (!selectedApp || !matricInput) return

    setProcessing(true)
    try {
      // Backend expects an array of assignments
      const payload = [{
        application_id: selectedApp.application_id,
        matric_number: matricInput
      }]

      const response = await registrarAPI.assignMatricNumbers(payload)

      if (response && !response.error) {
        toast.success(`Student ${selectedApp.student_name} matriculated successfully!`)
        setSelectedApp(null)
        fetchApplications() // Refresh list
      } else {
        toast.error("Failed to assign matric number")
      }
    } catch (error: any) {
      toast.error(error.message || "Error processing assignment")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DashboardLayout title="Admissions & Matriculation" role="registrar">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Pending Matriculation</h1>
            <p className="text-muted-foreground">Admitted students waiting for matric numbers.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No pending applications found.
              </div>
            ) : (
              <div className="divide-y">
                {applications.map((app) => (
                  <div key={app.application_id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{app.student_name}</h3>
                        <Badge variant="outline">{app.department}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        App No: {app.application_number} â€¢ {app.programme_type}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-mono bg-blue-50 w-fit px-2 py-1 rounded">
                        Suggested: {app.suggested_matric}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" /> View Details
                      </Button>
                      <Button size="sm" onClick={() => handleOpenAssign(app)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Assign Matric
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Modal */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Matric Number</DialogTitle>
              <DialogDescription>
                Confirm matriculation for <strong>{selectedApp?.student_name}</strong>.
                This will create a Student User account automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div>
                <Label>Matriculation Number</Label>
                <Input
                  value={matricInput}
                  onChange={(e) => setMatricInput(e.target.value)}
                  className="font-mono text-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ensure this follows the format: {selectedApp?.department_code}/YEAR/PROG/XXX
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
              <Button onClick={handleAssignMatric} disabled={processing || !matricInput}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}