import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  Zap,
  TrendingUp,
  Plus,
  Loader,
  Calendar,
} from "lucide-react";
import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import { useToast } from "@/components/ui/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: Date | string;
  status: string;
}

interface PaymentRemindersManagerProps {
  invoices?: Invoice[];
  onReminderSent?: (invoiceId: string) => void;
}

type ReminderAction = "email" | "sms" | "in_app" | "webhook";
type TriggerType = "overdue" | "upcoming_due" | "unpaid_invoice" | "payment_received";

interface ReminderRule {
  name: string;
  description: string;
  isActive: boolean;
  triggers: Array<{
    type: TriggerType;
    daysBeforeDue?: number;
    daysAfterDue?: number;
  }>;
  actions: Array<{
    type: ReminderAction;
    recipients: string[];
    template: string;
    attachments?: string;
  }>;
}

export const PaymentRemindersManager: React.FC<PaymentRemindersManagerProps> = ({
  invoices = [],
  onReminderSent,
}) => {
  const { toast } = useToast();
  const {
    isLoading,
    rules,
    overdueInvoices,
    upcomingInvoices,
    stats,
    loadReminders,
    createRule,
    scheduleReminder,
    autoScheduleReminders,
  } = usePaymentReminders();

  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState<ReminderRule>({
    name: "",
    description: "",
    isActive: true,
    triggers: [{ type: "upcoming_due", daysBeforeDue: 3 }],
    actions: [
      { type: "email", recipients: [], template: "payment_reminder", attachments: "invoice_pdf" },
    ],
  });

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      toast({
        title: "Missing required field",
        description: "Please enter a rule name",
        variant: "destructive",
      });
      return;
    }

    if (newRule.actions.some((action) => action.recipients.length === 0)) {
      toast({
        title: "Missing recipients",
        description: "Please add at least one recipient for each action",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRule(newRule);
      toast({
        title: "Rule created successfully",
        description: `'${newRule.name}' is now active`,
      });

      setNewRule({
        name: "",
        description: "",
        isActive: true,
        triggers: [{ type: "upcoming_due", daysBeforeDue: 3 }],
        actions: [
          { type: "email", recipients: [], template: "payment_reminder", attachments: "invoice_pdf" },
        ],
      });
      setIsCreatingRule(false);

      // Reload reminders
      await loadReminders();
    } catch (error) {
      toast({
        title: "Failed to create rule",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleScheduleReminder = async (invoiceId: string) => {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 3);

      await scheduleReminder(invoiceId, "client-id", "upcoming", reminderDate);

      toast({
        title: "Reminder scheduled",
        description: "Payment reminder has been sent",
      });

      if (onReminderSent) {
        onReminderSent(invoiceId);
      }
    } catch (error) {
      toast({
        title: "Failed to schedule reminder",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAutoSchedule = async () => {
    try {
      await autoScheduleReminders();
      toast({
        title: "Reminders scheduled",
        description: "All reminders have been automatically scheduled",
      });
    } catch (error) {
      toast({
        title: "Failed to schedule reminders",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const triggerTypeLabels: Record<TriggerType, string> = {
    overdue: "Overdue Invoice",
    upcoming_due: "Upcoming Due Date",
    unpaid_invoice: "Unpaid Invoice",
    payment_received: "Payment Received",
  };

  const actionTypeIcons: Record<ReminderAction, React.ReactNode> = {
    email: <Mail className="w-4 h-4" />,
    sms: <MessageSquare className="w-4 h-4" />,
    in_app: <Bell className="w-4 h-4" />,
    webhook: <Zap className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Reminders
                </p>
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.pendingReminders || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue Invoices
                </p>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overdueInvoices.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upcoming Due
                </p>
                <Calendar className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {upcomingInvoices.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Rules
                </p>
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {rules?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleAutoSchedule}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Auto-Schedule All Reminders
              </>
            )}
          </Button>

          <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Automation Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Rule Name */}
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., Payment Due Reminders"
                    value={newRule.name}
                    onChange={(e) =>
                      setNewRule({ ...newRule, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    placeholder="Describe what this rule does..."
                    value={newRule.description}
                    onChange={(e) =>
                      setNewRule({ ...newRule, description: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Trigger */}
                <div>
                  <Label>Trigger Type</Label>
                  <Select
                    value={newRule.triggers[0]?.type || "upcoming_due"}
                    onValueChange={(type) =>
                      setNewRule({
                        ...newRule,
                        triggers: [
                          {
                            type: type as TriggerType,
                            daysBeforeDue: 3,
                          },
                        ],
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(triggerTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Days Before Due */}
                {newRule.triggers[0]?.type === "upcoming_due" && (
                  <div>
                    <Label htmlFor="days-before">Days Before Due Date</Label>
                    <Input
                      id="days-before"
                      type="number"
                      min="1"
                      max="30"
                      value={newRule.triggers[0]?.daysBeforeDue || 3}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          triggers: [
                            {
                              ...newRule.triggers[0],
                              daysBeforeDue: parseInt(e.target.value),
                            },
                          ],
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Action Type */}
                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={newRule.actions[0]?.type || "email"}
                    onValueChange={(type) => {
                      const actions = [...newRule.actions];
                      actions[0] = {
                        ...actions[0],
                        type: type as ReminderAction,
                      };
                      setNewRule({ ...newRule, actions });
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">In-App Notification</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipients */}
                <div>
                  <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                  <Input
                    id="recipients"
                    placeholder="client@example.com, client2@example.com"
                    value={newRule.actions[0]?.recipients.join(", ") || ""}
                    onChange={(e) => {
                      const actions = [...newRule.actions];
                      actions[0] = {
                        ...actions[0],
                        recipients: e.target.value
                          .split(",")
                          .map((r) => r.trim())
                          .filter(Boolean),
                      };
                      setNewRule({ ...newRule, actions });
                    }}
                    className="mt-2"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateRule}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Rule"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingRule(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              Overdue Invoices ({overdueInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.clientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {invoice.currency} ${invoice.amount.toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleScheduleReminder(invoice.id)}
                      disabled={isLoading}
                      className="mt-2"
                    >
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Invoices */}
      {upcomingInvoices.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Clock className="w-5 h-5" />
              Upcoming Due Dates ({upcomingInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.clientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {invoice.currency} ${invoice.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Rules */}
      {rules && rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Automation Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rule.description}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Triggers:
                    </p>
                    <div className="space-y-1">
                      {rule.triggers?.map((trigger, idx) => (
                        <p key={idx} className="text-gray-900 dark:text-white">
                          {triggerTypeLabels[trigger.type]}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Actions:
                    </p>
                    <div className="space-y-1">
                      {rule.actions?.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {actionTypeIcons[action.type]}
                          <span className="text-gray-900 dark:text-white">
                            {action.type.charAt(0).toUpperCase() +
                              action.type.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {overdueInvoices.length === 0 &&
        upcomingInvoices.length === 0 &&
        !rules?.length && (
          <Card className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-semibold mb-2">
              All set!
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No overdue invoices or upcoming reminders. Your invoices are on track.
            </p>
          </Card>
        )}
    </div>
  );
};

export default PaymentRemindersManager;
