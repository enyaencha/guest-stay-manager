import { DepartmentStats } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Building2 } from "lucide-react";

interface DepartmentTableProps {
  data: DepartmentStats[];
}

export const DepartmentTable = ({ data }: DepartmentTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Department Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Tasks Completed</TableHead>
              <TableHead className="text-center">Avg Response (min)</TableHead>
              <TableHead className="text-right">Satisfaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((dept) => (
              <TableRow key={dept.department}>
                <TableCell className="font-medium">{dept.department}</TableCell>
                <TableCell className="text-center">{dept.tasksCompleted}</TableCell>
                <TableCell className="text-center">{dept.avgResponseTime}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Progress 
                      value={dept.satisfaction} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium w-10">{dept.satisfaction}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
