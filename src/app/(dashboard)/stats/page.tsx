
import StatsDashboard from "@/components/dashboard/stats-dashboard";

export default function StatsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">My Statistics</h1>
                <p className="text-muted-foreground">
                    An overview of your project contributions and performance.
                </p>
            </div>
            <StatsDashboard />
        </div>
    )
}
