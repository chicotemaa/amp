"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

const projects = [
  {
    name: "Modern Office Complex",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    progress: 75,
    status: "On Track",
  },
  {
    name: "Eco Residential Tower",
    startDate: "2024-02-01",
    endDate: "2024-08-15",
    progress: 45,
    status: "Delayed",
  },
  {
    name: "Cultural Center",
    startDate: "2024-03-10",
    endDate: "2024-09-30",
    progress: 90,
    status: "Ahead",
  },
];

export function ProjectTimeline() {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-6">
        {projects.map((project) => (
          <div key={project.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{project.name}</h4>
              <span className={`text-sm ${
                project.status === "On Track" ? "text-green-500" :
                project.status === "Delayed" ? "text-red-500" :
                "text-blue-500"
              }`}>
                {project.status}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={project.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{project.startDate}</span>
                <span>{project.endDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}