import { GeneratedSchedule } from "@/types/studyPlan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, RotateCcw, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SchedulePreviewProps {
  schedule: GeneratedSchedule;
}

export const SchedulePreview = ({ schedule }: SchedulePreviewProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{schedule.summary.total_lectures}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{schedule.summary.completion_day}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buffer Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{schedule.summary.buffer_days}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Daily Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {(schedule.summary.total_lectures / schedule.summary.completion_day).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subject Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(schedule.summary.lectures_per_subject).map(([subject, lectures]) => (
              <div key={subject} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                <span className="font-medium">{subject}</span>
                <Badge variant="secondary">{lectures} lectures</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Lectures</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.days.map((day) => (
                  <TableRow key={day.day} className={day.lectures.length === 0 ? "opacity-60" : ""}>
                    <TableCell className="font-medium">Day {day.day}</TableCell>
                    <TableCell>{day.date || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {day.subjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {day.lectures.map((lecture, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{lecture.chapter}</span>
                            <span className="text-muted-foreground"> ({lecture.count})</span>
                          </div>
                        ))}
                        {day.lectures.length === 0 && (
                          <span className="text-muted-foreground text-sm">No lectures</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {day.practice_note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};