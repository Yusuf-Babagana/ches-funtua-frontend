"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Loader2, Plus, Edit, Trash2, Building, Calendar,
  ServerCog, Save, RefreshCw, UserCheck, Layers
} from "lucide-react"
import { adminAPI, apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog"

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [lecturers, setLecturers] = useState<any[]>([]) // For HOD dropdown
  const [levelConfigs, setLevelConfigs] = useState<any[]>([]) // ✅ New: Level Configs

  // Modal States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)
  const [isSemModalOpen, setIsSemModalOpen] = useState(false)
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false) // ✅ New
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form States
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "", hod_id: "unassigned" })
  const [semForm, setSemForm] = useState({
    session: "", semester: "first", start_date: "", end_date: "", registration_deadline: ""
  })
  // ✅ New Form for Level Config
  const [levelForm, setLevelForm] = useState({
    level: "", current_semester_id: "", is_registration_open: true
  })

  const [submitting, setSubmitting] = useState(false)

  // Fetch Data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [deptRes, semRes, hodsRes, levelsRes] = await Promise.all([
        adminAPI.getDepartments(),
        adminAPI.getSemesters(),
        adminAPI.getAvailableHODs(),
        apiClient.get('/academics/admin/level-config/') // Direct call since we added it recently
      ])

      setDepartments(Array.isArray(deptRes) ? deptRes : deptRes.results || [])
      setSemesters(Array.isArray(semRes) ? semRes : semRes.results || [])
      setLecturers(Array.isArray(hodsRes) ? hodsRes : [])
      setLevelConfigs(Array.isArray(levelsRes) ? levelsRes : levelsRes.results || [])

    } catch (error) {
      console.error(error)
      toast.error("Failed to load system data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Department Handlers ---
  const handleSaveDept = async () => {
    if (!deptForm.name || !deptForm.code) return toast.error("Name and Code required")

    setSubmitting(true)
    try {
      let deptId;
      let res;

      if (editingItem) {
        res = await adminAPI.updateDepartment(editingItem.id, {
          name: deptForm.name,
          code: deptForm.code,
          description: deptForm.description
        })
        if (res.error) throw new Error(res.error.detail || "Update failed")
        deptId = editingItem.id
        toast.success("Department updated")
      } else {
        res = await adminAPI.createDepartment({
          name: deptForm.name,
          code: deptForm.code,
          description: deptForm.description
        })

        if (res.error) throw new Error(res.error.detail || "Creation failed");

        deptId = res.id
        toast.success("Department created")
      }

      // Handle HOD Assignment if changed AND we have a valid deptId
      if (deptId && deptForm.hod_id && deptForm.hod_id !== "unassigned") {
        const hodRes = await adminAPI.assignHOD(deptId, Number(deptForm.hod_id))

        if (hodRes.error) {
          toast.warning(`Department saved, but HOD assignment failed: ${hodRes.error}`)
        } else {
          toast.success("HOD Assigned")
        }
      }

      setIsDeptModalOpen(false)
      fetchData()
    } catch (e: any) {
      console.error("Save Dept Error:", e)
      toast.error(e.message || "Operation failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDept = async (id: number) => {
    if (!confirm("Delete this department? This might cascade delete courses/students!")) return
    try {
      const res = await adminAPI.deleteDepartment(id)

      // Check for error in response
      if (res && res.error) {
        throw new Error(res.error.detail || "Delete failed on server")
      }

      toast.success("Department deleted")
      fetchData()
    } catch (e: any) {
      console.error("Delete Error:", e)
      toast.error(e.message || "Delete failed")
    }
  }

  // --- Semester Handlers ---
  const handleSaveSem = async () => {
    setSubmitting(true)
    try {
      let res;
      if (editingItem) {
        res = await adminAPI.updateSemester(editingItem.id, semForm)
        if (res.error) throw new Error(res.error.detail || "Update failed")
        toast.success("Semester updated")
      } else {
        res = await adminAPI.createSemester({ ...semForm, is_current: false })
        if (res.error) throw new Error(res.error.detail || "Creation failed")
        toast.success("Semester created")
      }
      setIsSemModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Operation failed")
    } finally {
      setSubmitting(false)
    }
  }

  // --- Level Config Handlers ---
  const handleInitLevels = async () => {
    setSubmitting(true)
    try {
      await apiClient.post('/academics/admin/level-config/init_defaults/')
      toast.success("Levels initialized with defaults")
      fetchData()
    } catch (e) {
      toast.error("Initialization failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveLevelConfig = async () => {
    if (!levelForm.current_semester_id) return toast.error("Semester selection required")

    setSubmitting(true)
    try {
      // Payload must match serializer expectations
      const payload = {
        current_semester: Number(levelForm.current_semester_id),
        is_registration_open: levelForm.is_registration_open
        // 'level' is usually read-only after creation, but we send it if creating (though we mostly update)
      }

      if (editingItem) {
        await apiClient.put(`/academics/admin/level-config/${editingItem.id}/`, payload)
        toast.success(`Level ${editingItem.level} configuration updated`)
      }

      setIsLevelModalOpen(false)
      fetchData()
    } catch (e) {
      toast.error("Failed to update level configuration")
    } finally {
      setSubmitting(false)
    }
  }

  // --- Utils ---
  const openDeptModal = (dept?: any) => {
    setEditingItem(dept || null)
    setDeptForm(dept ? {
      name: dept.name,
      code: dept.code,
      description: dept.description,
      hod_id: dept.hod ? dept.hod.toString() : "unassigned"
    } : { name: "", code: "", description: "", hod_id: "unassigned" })
    setIsDeptModalOpen(true)
  }

  const openSemModal = (sem?: any) => {
    setEditingItem(sem || null)
    setSemForm(sem ? {
      session: sem.session, semester: sem.semester,
      start_date: sem.start_date, end_date: sem.end_date,
      registration_deadline: sem.registration_deadline
    } : { session: "", semester: "first", start_date: "", end_date: "", registration_deadline: "" })
    setIsSemModalOpen(true)
  }

  const openLevelModal = (config: any) => {
    setEditingItem(config)
    setLevelForm({
      level: config.level,
      current_semester_id: config.current_semester?.toString() || "",
      is_registration_open: config.is_registration_open
    })
    setIsLevelModalOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin Console" role="super-admin">
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Console" role="super-admin">
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
            <p className="text-slate-500">Full control over academic structure.</p>
          </div>
          <Button variant="outline" onClick={fetchData}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="semesters">Sessions</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="system">Tools</TabsTrigger>
          </TabsList>

          {/* --- DEPARTMENTS TAB --- */}
          <TabsContent value="departments" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => openDeptModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>HOD</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map(dept => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-mono font-bold text-slate-700">{dept.code}</TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        {dept.hod_name ? (
                          <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs w-fit">
                            <UserCheck className="h-3 w-3" /> {dept.hod_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dept.student_count} Students • {dept.course_count} Courses
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openDeptModal(dept)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteDept(dept.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Dept Modal */}
            <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit' : 'Add'} Department</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Code</Label>
                    <Input className="col-span-3" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} placeholder="e.g. CSC" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Name</Label>
                    <Input className="col-span-3" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="e.g. Computer Science" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Description</Label>
                    <Input className="col-span-3" value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Assign HOD</Label>
                    <div className="col-span-3">
                      <Select
                        value={deptForm.hod_id}
                        onValueChange={(val) => setDeptForm({ ...deptForm, hod_id: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Lecturer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                          {lecturers.map(l => (
                            <SelectItem key={l.id} value={l.id.toString()}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveDept} disabled={submitting} className="bg-blue-600">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* --- SEMESTERS TAB --- */}
          <TabsContent value="semesters" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => openSemModal()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Add Semester Record
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semesters.map(sem => (
                    <TableRow key={sem.id}>
                      <TableCell className="font-bold">{sem.session}</TableCell>
                      <TableCell className="capitalize">{sem.semester}</TableCell>
                      <TableCell>{sem.start_date}</TableCell>
                      <TableCell>{sem.registration_deadline}</TableCell>
                      <TableCell>
                        {sem.is_current ?
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Active</span> :
                          <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs">Past</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openSemModal(sem)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Sem Modal */}
            <Dialog open={isSemModalOpen} onOpenChange={setIsSemModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit' : 'Add'} Semester</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session</Label>
                      <Input value={semForm.session} onChange={e => setSemForm({ ...semForm, session: e.target.value })} placeholder="2024/2025" />
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={semForm.semester}
                        onChange={e => setSemForm({ ...semForm, semester: e.target.value })}
                      >
                        <option value="first">First</option>
                        <option value="second">Second</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={semForm.start_date} onChange={e => setSemForm({ ...semForm, start_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input type="date" value={semForm.end_date} onChange={e => setSemForm({ ...semForm, end_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Registration Deadline</Label>
                    <Input type="date" value={semForm.registration_deadline} onChange={e => setSemForm({ ...semForm, registration_deadline: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSem} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* --- LEVELS TAB --- */}
          <TabsContent value="levels" className="space-y-4 mt-4">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <h3 className="font-bold text-blue-900">Level-Specific Semesters</h3>
                <p className="text-sm text-blue-700">Configure which semester applies to each student level (e.g. 100L in First Sem, 400L in Second).</p>
              </div>
              {levelConfigs.length === 0 && (
                <Button onClick={handleInitLevels} disabled={submitting} size="sm">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Initialize Defaults
                </Button>
              )}
            </div>

            <Card>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Current Active Session</TableHead>
                    <TableHead>Current Semester</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levelConfigs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No configurations found. Click Initialize Defaults.</TableCell></TableRow>
                  ) : (
                    levelConfigs.map(conf => (
                      <TableRow key={conf.id}>
                        <TableCell><Badge variant="outline">{conf.level} Level</Badge></TableCell>
                        <TableCell className="font-medium">{conf.semester_details?.session || "Not Set"}</TableCell>
                        <TableCell className="capitalize">{conf.semester_details?.semester || "-"}</TableCell>
                        <TableCell>
                          {conf.is_registration_open ?
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><div className="w-2 h-2 rounded-full bg-green-500"></div> OPEN</span> :
                            <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><div className="w-2 h-2 rounded-full bg-red-500"></div> CLOSED</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openLevelModal(conf)}>
                            <Edit className="h-4 w-4 text-blue-600" /> Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Level Modal */}
            <Dialog open={isLevelModalOpen} onOpenChange={setIsLevelModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Level {editingItem?.level}</DialogTitle>
                  <DialogDescription>Set the active semester for this level.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label>Active Semester</Label>
                    <Select
                      value={levelForm.current_semester_id}
                      onValueChange={(val) => setLevelForm({ ...levelForm, current_semester_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map(sem => (
                          <SelectItem key={sem.id} value={sem.id.toString()}>
                            {sem.session} - {sem.semester.charAt(0).toUpperCase() + sem.semester.slice(1)} Semester
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="space-y-0.5">
                      <Label>Registration Open</Label>
                      <p className="text-xs text-muted-foreground">Allow students in this level to register courses.</p>
                    </div>
                    <Switch
                      checked={levelForm.is_registration_open}
                      onCheckedChange={(checked) => setLevelForm({ ...levelForm, is_registration_open: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveLevelConfig} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* --- SYSTEM TAB --- */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ServerCog className="h-5 w-5" /> Advanced Tools</CardTitle>
                <CardDescription>Use these tools to manage the academic lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-blue-900">Start New Session Wizard</h3>
                    <p className="text-sm text-blue-700">Archives current session, resets registration, creates new semester.</p>
                  </div>
                  <Button onClick={() => window.location.href = '/dashboard/ict/system'}>Go to Wizard</Button>
                </div>
                <div className="p-4 border rounded-lg bg-orange-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-orange-900">User Management</h3>
                    <p className="text-sm text-orange-700">Manage Staff, Students, and Admin accounts.</p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard/ict/user-management'}>Manage Users</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  )
}