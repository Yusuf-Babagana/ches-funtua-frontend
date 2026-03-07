"use client"
import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { academicsAPI } from "@/lib/api"
import { toast } from "sonner"
import { Upload, FileCheck, Loader2 } from "lucide-react"

export default function ICTResultUpload() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<any>(null)

    const handleUpload = async () => {
        if (!file) return toast.error("Please select a file first")

        setLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await academicsAPI.uploadResults(formData)
            if (res.error) {
                toast.error(res.error.detail || "Upload failed. Check file format.")
            } else {
                setStats(res)
                toast.success(`Successfully processed ${res.processed} students!`)
            }
        } catch (e) {
            toast.error("Upload failed. Check file format.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout title="Result Management" role="ict">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Result Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 border-slate-200">
                            <Upload className="h-10 w-10 text-slate-400 mb-4" />
                            <p className="text-sm text-slate-600 mb-4">Upload CSV with 'Name' and Course Code columns (e.g. CHE 221)</p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="max-w-xs"
                            />
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
                            Process Results
                        </Button>
                    </CardContent>
                </Card>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-green-100 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-green-700">{stats.processed}</div>
                                <div className="text-sm text-green-600">Students Imported</div>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-100 bg-orange-50">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-orange-700">{stats.skipped?.length || 0}</div>
                                <div className="text-sm text-orange-600">Skipped (No Match)</div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
