"use client";

import { useState, useEffect } from "react";
import { AdminNavbar } from "@/components/layout/admin/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  CheckCircle2,
  MoreHorizontal,
  TrendingUp,
  Settings2,
  UserPlus,
  AlertTriangle,
  DollarSign,
  Upload,
  ExternalLink,
  FileText,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminBountyModal } from "@/components/admin-bounty-modal";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBounty } from "@/lib/bounty-context";
import { BountyStatus, WorkSubmission } from "@/lib/types";
import { formatStatus } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminDashboard() {
  const {
    bounties,
    nonAdminUsers,
    updateBountyStatus,
    approveBounty,
    getAllApplicationsForBounty,
    acceptApplication,
    rejectApplication,
    fetchBountyApplications,
    fetchWorkSubmissions,
    reviewWorkSubmission,
  } = useBounty();

  const [activeTab, setActiveTab] = useState<"overview" | "finance">(
    "overview",
  );
  const [showAdminBountyModal, setShowAdminBountyModal] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<string | null>(null);
  const [isManagingApplications, setIsManagingApplications] = useState(false);
  const [isManagingSubmissions, setIsManagingSubmissions] = useState(false);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<WorkSubmission[]>([]);

  // Load all submissions on mount for the indicators
  useEffect(() => {
    const loadAllSubmissions = async () => {
      const allSubs: WorkSubmission[] = [];
      for (const bounty of bounties) {
        try {
          const subs = await fetchWorkSubmissions(bounty.id);
          allSubs.push(...subs);
        } catch (error) {
          console.error(
            `Failed to load submissions for bounty ${bounty.id}:`,
            error,
          );
        }
      }
      setAllSubmissions(allSubs);
    };

    if (bounties.length > 0) {
      loadAllSubmissions();
    }
  }, [bounties, fetchWorkSubmissions]);

  const handleStatusChange = (bountyId: string, newStatus: BountyStatus) => {
    updateBountyStatus(bountyId, newStatus);
  };

  const handleApprovalChange = async (bountyId: string, approved: boolean) => {
    setIsUpdating(true);
    try {
      approveBounty(bountyId, approved);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplicationAction = async (
    applicationId: string,
    action: "accept" | "reject",
  ) => {
    setIsUpdating(true);
    try {
      if (action === "accept") {
        await acceptApplication(applicationId);
      } else {
        await rejectApplication(applicationId);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmissionReview = async (
    submissionId: string,
    action: "approved" | "rejected" | "needs_revision",
    reviewNotes?: string,
  ) => {
    setIsUpdating(true);
    try {
      await reviewWorkSubmission(submissionId, {
        status: action,
        reviewNotes: reviewNotes,
      });
      await loadWorkSubmissions();
    } catch (error) {
      console.error("Failed to review submission:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const loadWorkSubmissions = async () => {
    if (!selectedBounty) return;

    setSubmissionsLoading(true);
    try {
      const submissions = await fetchWorkSubmissions(selectedBounty);
      setWorkSubmissions(submissions);
    } catch (error) {
      console.error("Failed to load work submissions:", error);
      setWorkSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (isManagingSubmissions && selectedBounty) {
      loadWorkSubmissions();
    }
  }, [isManagingSubmissions, selectedBounty]);

  const totalRewards = bounties.reduce((sum, b) => sum + b.bountyAmount, 0);
  const activeBounties = bounties.filter(
    (b) => b.status === "TO_DO" || b.status === "IN_PROGRESS",
  ).length;
  const totalHunters = nonAdminUsers.filter((u) => u.role === "CLIENT").length;
  const totalPayouts = bounties
    .filter((b) => b.status === "DONE")
    .reduce((sum, b) => sum + b.bountyAmount, 0);
  const platformFee = totalPayouts * 0.1;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "finance", label: "Finance", icon: DollarSign },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <AdminNavbar isAdmin={true} />

        <div className="imd:container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-extrabold">Admin Console</h1>
              <p className="text-muted-foreground">
                Platform-wide overview and management
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdminBountyModal(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" /> New Bounty
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Settings2 className="h-4 w-4" /> Global Settings
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-8 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Total Rewards
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalRewards.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1 font-medium">
                      <TrendingUp className="h-3 w-3" /> +12.5% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Active Bounties
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeBounties}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      12 pending approval
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Total Hunters
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalHunters}</div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1 font-medium">
                      <TrendingUp className="h-3 w-3" /> +8 this week
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      System Health
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Operational</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      All services running smoothly
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 overflow-hidden border-muted">
                <CardHeader className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Bounties</CardTitle>
                      <CardDescription>
                        All bounties on the platform
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[300px] py-3">Bounty</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bounties.map((bounty) => {
                        const applications = getAllApplicationsForBounty(
                          bounty.id,
                        );
                        const appCount = applications?.length || 0;
                        const pendingApps =
                          applications?.filter((a) => a.status === "pending")
                            .length || 0;

                        const submissions = allSubmissions.filter(
                          (s) => s.bountyId === bounty.id,
                        );
                        const submissionCount = submissions.length;
                        const pendingSubs = submissions.filter(
                          (s) => s.status === "pending",
                        ).length;

                        return (
                          <TableRow
                            key={bounty.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-medium py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                  {bounty.assigneeUser?.name?.[0] || "?"}
                                </div>
                                <span className="line-clamp-1">
                                  {bounty.title}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold tracking-tight"
                              >
                                {bounty.categoryId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    bounty.status === "TO_DO"
                                      ? "bg-green-500"
                                      : bounty.status === "IN_PROGRESS"
                                        ? "bg-blue-500"
                                        : bounty.status === "DONE"
                                          ? "bg-green-600"
                                          : "bg-yellow-500"
                                  }`}
                                />
                                <span className="capitalize text-sm">
                                  {formatStatus(bounty.status)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {bounty.assignee ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 border">
                                    <AvatarImage
                                      src={
                                        bounty.createdByUser?.avatar ||
                                        "/placeholder-user.jpg"
                                      }
                                    />
                                    <AvatarFallback>
                                      {bounty.assigneeUser?.name?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">
                                    {bounty.assigneeUser?.name}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[10px] gap-1 px-2 border border-dashed"
                                >
                                  <UserPlus className="h-3 w-3" /> Assign
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-xs gap-1 px-2 ${
                                  pendingApps > 0
                                    ? "border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20"
                                    : appCount > 0
                                      ? "border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                                      : "border border-dashed"
                                }`}
                                onClick={() => {
                                  setSelectedBounty(bounty.id);
                                  setIsManagingApplications(true);
                                  fetchBountyApplications(bounty.id);
                                }}
                              >
                                <Users className="h-3 w-3" />
                                {appCount > 0 ? (
                                  <>
                                    {appCount}{" "}
                                    {pendingApps > 0 &&
                                      `(${pendingApps} pending)`}
                                  </>
                                ) : (
                                  "None"
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-xs gap-1 px-2 ${
                                  pendingSubs > 0
                                    ? "border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20"
                                    : submissionCount > 0
                                      ? "border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                                      : "border border-dashed"
                                }`}
                                onClick={() => {
                                  setSelectedBounty(bounty.id);
                                  setIsManagingSubmissions(true);
                                }}
                              >
                                <Upload className="h-3 w-3" />
                                {submissionCount > 0 ? (
                                  <>
                                    {submissionCount}{" "}
                                    {pendingSubs > 0 &&
                                      `(${pendingSubs} pending)`}
                                  </>
                                ) : (
                                  "None"
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {bounty.bountyAmount} ZEC
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>
                                    Change Status
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(bounty.id, "TO_DO")
                                    }
                                  >
                                    Set To Do
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        bounty.id,
                                        "IN_PROGRESS",
                                      )
                                    }
                                  >
                                    Set In Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(bounty.id, "IN_REVIEW")
                                    }
                                  >
                                    Set In Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(bounty.id, "DONE")
                                    }
                                  >
                                    Mark as Done
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>
                                    Approval
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleApprovalChange(bounty.id, true)
                                    }
                                    disabled={bounty.isApproved}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve Bounty
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleApprovalChange(bounty.id, false)
                                    }
                                    disabled={!bounty.isApproved}
                                    className="text-destructive"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Reject Bounty
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Manage</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedBounty(bounty.id);
                                      setIsManagingApplications(true);
                                      fetchBountyApplications(bounty.id);
                                    }}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    View Applications
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedBounty(bounty.id);
                                      setIsManagingSubmissions(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Review Submissions
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "finance" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Total Payouts
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      ${totalPayouts.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      All time
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Platform Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${platformFee.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      10% fee on payouts
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      Pending Payouts
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$8,500</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting completion
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 overflow-hidden border-muted">
                <CardHeader className="p-6 border-b">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      Track all payouts and platform fees
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="py-3">Bounty</TableHead>
                        <TableHead>Hunter</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bounties
                        .filter((b) => b.status === "DONE")
                        .map((bounty) => (
                          <TableRow
                            key={bounty.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-medium py-4">
                              <span className="line-clamp-1">
                                {bounty.title}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {bounty.assigneeUser?.name || "Unassigned"}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-green-600">
                              +${bounty.bountyAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-red-600">
                              -${(bounty.bountyAmount * 0.1).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Jan {Math.floor(Math.random() * 28) + 1}, 2024
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Paid</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <AdminBountyModal
          open={showAdminBountyModal}
          onOpenChange={setShowAdminBountyModal}
        />

        <Dialog
          open={isManagingApplications}
          onOpenChange={setIsManagingApplications}
        >
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Applications
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {selectedBounty &&
              getAllApplicationsForBounty(selectedBounty)?.length > 0 ? (
                <div className="space-y-4">
                  {getAllApplicationsForBounty(selectedBounty).map(
                    (application) => (
                      <div
                        key={application.id}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {application.applicantUser?.name ||
                                  "Unknown User"}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  application.status === "accepted"
                                    ? "text-green-600 border-green-200"
                                    : application.status === "rejected"
                                      ? "text-red-600 border-red-200"
                                      : "text-yellow-600 border-yellow-200"
                                }
                              >
                                {application.status || "pending"}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              Applied on:{" "}
                              {format(
                                new Date(application.appliedAt),
                                "PPP 'at' p",
                              )}
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                              <p className="text-slate-900 dark:text-slate-100">
                                {application.message}
                              </p>
                            </div>
                          </div>
                        </div>

                        {application.status === "pending" && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApplicationAction(
                                  application.id,
                                  "accept",
                                )
                              }
                              disabled={isUpdating}
                              className="flex-1"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleApplicationAction(
                                  application.id,
                                  "reject",
                                )
                              }
                              disabled={isUpdating}
                              className="flex-1"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No applications yet.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isManagingSubmissions}
          onOpenChange={setIsManagingSubmissions}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Review Work Submissions
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {submissionsLoading ? (
                <div className="flex justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin" />
                </div>
              ) : workSubmissions && workSubmissions.length > 0 ? (
                <div className="space-y-6">
                  {workSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                              {submission.submitterUser?.name || "Unknown User"}
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                submission.status === "approved"
                                  ? "text-green-600 border-green-200"
                                  : submission.status === "rejected"
                                    ? "text-red-600 border-red-200"
                                    : submission.status === "needs_revision"
                                      ? "text-orange-600 border-orange-200"
                                      : "text-yellow-600 border-yellow-200"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>

                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Submitted on:{" "}
                            {format(
                              new Date(submission.submittedAt),
                              "PPP 'at' p",
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                Work Description:
                              </label>
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                                <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                                  {submission.description}
                                </p>
                              </div>
                            </div>

                            {submission.deliverableUrl && (
                              <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                  Deliverable Link:
                                </label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                                  <a
                                    href={submission.deliverableUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-2 break-all"
                                  >
                                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    {submission.deliverableUrl}
                                  </a>
                                </div>
                              </div>
                            )}

                            {submission.reviewNotes && (
                              <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                  Review Notes:
                                </label>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                  <p className="text-slate-900 dark:text-slate-100">
                                    {submission.reviewNotes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {submission.status === "pending" && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`review-notes-${submission.id}`}>
                                Review Notes (optional)
                              </Label>
                              <Textarea
                                id={`review-notes-${submission.id}`}
                                placeholder="Add feedback for the submitter..."
                                className="mt-2"
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={() => {
                                  const textarea = document.getElementById(
                                    `review-notes-${submission.id}`,
                                  ) as HTMLTextAreaElement;
                                  handleSubmissionReview(
                                    submission.id,
                                    "approved",
                                    textarea?.value,
                                  );
                                }}
                                disabled={isUpdating}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve & Mark as Done
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() => {
                                  const textarea = document.getElementById(
                                    `review-notes-${submission.id}`,
                                  ) as HTMLTextAreaElement;
                                  handleSubmissionReview(
                                    submission.id,
                                    "needs_revision",
                                    textarea?.value,
                                  );
                                }}
                                disabled={isUpdating}
                                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Request Revision
                              </Button>

                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const textarea = document.getElementById(
                                    `review-notes-${submission.id}`,
                                  ) as HTMLTextAreaElement;
                                  handleSubmissionReview(
                                    submission.id,
                                    "rejected",
                                    textarea?.value,
                                  );
                                }}
                                disabled={isUpdating}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {submission.status === "approved" && (
                        <div className="border-t border-green-200 dark:border-green-800 pt-4">
                          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <div>
                              <div className="font-semibold text-green-800 dark:text-green-200">
                                Submission Approved
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-400">
                                Work has been approved and bounty status changed
                                to "Done"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {submission.status === "rejected" && (
                        <div className="border-t border-red-200 dark:border-red-800 pt-4">
                          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <div>
                              <div className="font-semibold text-red-800 dark:text-red-200">
                                Submission Rejected
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-400">
                                Bounty status changed back to "In Progress"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {submission.status === "needs_revision" && (
                        <div className="border-t border-orange-200 dark:border-orange-800 pt-4">
                          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            <div>
                              <div className="font-semibold text-orange-800 dark:text-orange-200">
                                Revision Requested
                              </div>
                              <div className="text-sm text-orange-600 dark:text-orange-400">
                                Bounty status changed back to "In Progress"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No Work Submissions Yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    This bounty hasn't received any work submissions yet.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}
