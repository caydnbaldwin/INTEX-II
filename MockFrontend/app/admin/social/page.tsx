"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Share2, Heart, MessageCircle, Eye, Calendar } from "lucide-react";

const posts = [
  {
    id: "1",
    title: "Spring Fundraiser Success!",
    platform: "Instagram",
    date: "2024-03-18",
    status: "published",
    likes: 245,
    comments: 32,
    views: 1250,
  },
  {
    id: "2",
    title: "Meet Our New Residents",
    platform: "Facebook",
    date: "2024-03-15",
    status: "published",
    likes: 189,
    comments: 45,
    views: 890,
  },
  {
    id: "3",
    title: "Volunteer Appreciation Day",
    platform: "Twitter",
    date: "2024-03-12",
    status: "published",
    likes: 156,
    comments: 23,
    views: 720,
  },
  {
    id: "4",
    title: "Education Program Update",
    platform: "Instagram",
    date: "2024-03-20",
    status: "scheduled",
    likes: 0,
    comments: 0,
    views: 0,
  },
  {
    id: "5",
    title: "Donor Spotlight: March",
    platform: "Facebook",
    date: "2024-03-22",
    status: "draft",
    likes: 0,
    comments: 0,
    views: 0,
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "draft":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getPlatformColor(platform: string) {
  switch (platform) {
    case "Instagram":
      return "bg-pink-100 text-pink-700";
    case "Facebook":
      return "bg-blue-100 text-blue-700";
    case "Twitter":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function SocialMediaPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Social Media Posts
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and schedule social media content
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Share2 className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-2xl font-bold text-foreground">
              {posts.filter((p) => p.status === "published").length}
            </p>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-2xl font-bold text-foreground">
              {posts.filter((p) => p.status === "scheduled").length}
            </p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-2xl font-bold text-foreground">
              {posts.reduce((sum, p) => sum + p.likes, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Eye className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-2xl font-bold text-foreground">
              {posts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Platform
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Engagement
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-4 font-medium text-foreground">
                      {post.title}
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getPlatformColor(post.platform)
                        )}
                      >
                        {post.platform}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(post.date).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          getStatusColor(post.status)
                        )}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
