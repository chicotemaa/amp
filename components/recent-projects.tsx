"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const projects = [
  {
    name: "Modern Office Complex",
    progress: 75,
    image: "/projects/office.jpg",
    manager: {
      name: "Sarah Chen",
      avatar: "/avatars/sarah.jpg",
      initials: "SC"
    }
  },
  {
    name: "Eco Residential Tower",
    progress: 45,
    image: "/projects/residential.jpg",
    manager: {
      name: "Michael Park",
      avatar: "/avatars/michael.jpg",
      initials: "MP"
    }
  },
  {
    name: "Cultural Center",
    progress: 90,
    image: "/projects/cultural.jpg",
    manager: {
      name: "Emma Wilson",
      avatar: "/avatars/emma.jpg",
      initials: "EW"
    }
  }
];

export function RecentProjects() {
  return (
    <div className="space-y-8">
      {projects.map((project) => (
        <div key={project.name} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={project.manager.avatar} alt="Avatar" />
            <AvatarFallback>{project.manager.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{project.name}</p>
            <p className="text-sm text-muted-foreground">
              {project.manager.name}
            </p>
          </div>
          <div className="ml-auto font-medium">
            <Progress value={project.progress} className="h-2 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );
}